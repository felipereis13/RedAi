package redAi.backend.redAi.service.ai;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.config.properties.OpenAiProperties;
import redAi.backend.redAi.exception.AiServiceException;
import redAi.backend.redAi.model.entity.CriterioCorrecao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Primary
@ConditionalOnProperty(prefix = "ai", name = "provider", havingValue = "openai", matchIfMissing = true)
public class OpenAiCorrectionService implements AiCorrectionService {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final String apiUrl;
    private final String model;

    @Autowired
    public OpenAiCorrectionService(
            @Value("${AI_API_KEY:}") String apiKey,
            OpenAiProperties openAiProperties
    ) {
        this(apiKey, openAiProperties.apiUrl(), openAiProperties.model());
    }

    OpenAiCorrectionService(
            String apiKey,
            String apiUrl,
            String model
    ) {
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.apiKey = apiKey;
        this.apiUrl = apiUrl == null || apiUrl.isBlank()
                ? "https://api.openai.com/v1/responses"
                : apiUrl;
        this.model = model == null || model.isBlank() ? "gpt-5.2" : model;
    }

    @Override
    public AiCorrectionResult correct(String texto, List<CriterioCorrecao> criterios, double notaMaximaProva) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiServiceException("AI_API_KEY nao configurada");
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .timeout(Duration.ofSeconds(60))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(buildRequestBody(texto, criterios, notaMaximaProva)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new AiServiceException("Falha na chamada a IA: status HTTP " + response.statusCode());
            }

            return parseCorrectionResult(response.body(), notaMaximaProva);
        } catch (IOException exception) {
            throw new AiServiceException("Falha na comunicacao com o servico de IA", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new AiServiceException("Chamada ao servico de IA interrompida", exception);
        } catch (IllegalArgumentException exception) {
            throw new AiServiceException("Configuracao invalida do servico de IA", exception);
        }
    }

    private String buildRequestBody(String texto, List<CriterioCorrecao> criterios, double notaMaximaProva)
            throws JsonProcessingException {
        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("instructions", buildSystemPrompt(criterios, notaMaximaProva));
        requestBody.put("input", texto);
        requestBody.put("text", Map.of(
                "format", Map.of(
                        "type", "json_schema",
                        "name", "correcao_redacao",
                        "schema", buildJsonSchema(),
                        "strict", true
                )
        ));

        return objectMapper.writeValueAsString(requestBody);
    }

    private String buildSystemPrompt(List<CriterioCorrecao> criterios, double notaMaximaProva) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Voce e um corretor de redacoes para concursos publicos. ");
        prompt.append("Avalie a redacao exclusivamente pelos criterios abaixo. ");
        prompt.append("Jamais atribua nota maior que a notaMaxima de cada critÃ©rio. ");
        prompt.append("A notaTotal deve ser a soma das notas obtidas nos critÃ©rios e nÃ£o pode ultrapassar ");
        prompt.append(notaMaximaProva).append(". ");
        prompt.append("O percentualAproveitamento deve ser (notaTotal / notaMaximaProva) * 100. ");
        prompt.append("Retorne APENAS JSON valido, sem markdown, sem texto antes ou depois.\n\n");
        prompt.append("notaMaximaProva: ").append(notaMaximaProva).append("\n");
        prompt.append("Criterios:\n");

        for (CriterioCorrecao criterio : criterios) {
            prompt.append("- nome: ").append(criterio.getNome()).append("\n");
            prompt.append("  descricao: ").append(criterio.getDescricao()).append("\n");
            prompt.append("  notaMaxima: ").append(criterio.getNotaMaxima()).append("\n");
        }

        return prompt.toString();
    }

    private Map<String, Object> buildJsonSchema() {
        Map<String, Object> avaliacaoProperties = new LinkedHashMap<>();
        avaliacaoProperties.put("nome", Map.of("type", "string"));
        avaliacaoProperties.put("notaObtida", Map.of("type", "number"));
        avaliacaoProperties.put("notaMaxima", Map.of("type", "number"));
        avaliacaoProperties.put("comentario", Map.of("type", "string"));

        Map<String, Object> avaliacaoSchema = new LinkedHashMap<>();
        avaliacaoSchema.put("type", "object");
        avaliacaoSchema.put("additionalProperties", false);
        avaliacaoSchema.put("required", List.of("nome", "notaObtida", "notaMaxima", "comentario"));
        avaliacaoSchema.put("properties", avaliacaoProperties);

        Map<String, Object> resultProperties = new LinkedHashMap<>();
        resultProperties.put("notaTotal", Map.of("type", "number"));
        resultProperties.put("notaMaximaProva", Map.of("type", "number"));
        resultProperties.put("percentualAproveitamento", Map.of("type", "number"));
        resultProperties.put("feedbackGeral", Map.of("type", "string"));
        resultProperties.put("avaliacoesCriterios", Map.of("type", "array", "items", avaliacaoSchema));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "object");
        schema.put("additionalProperties", false);
        schema.put("required", List.of(
                "notaTotal",
                "notaMaximaProva",
                "percentualAproveitamento",
                "feedbackGeral",
                "avaliacoesCriterios"
        ));
        schema.put("properties", resultProperties);

        return schema;
    }

    private AiCorrectionResult parseCorrectionResult(String responseBody, double notaMaximaProva)
            throws JsonProcessingException {
        JsonNode responseJson = objectMapper.readTree(responseBody);
        String resultJson = extractOutputText(responseJson);
        if (resultJson == null || resultJson.isBlank()) {
            throw new AiServiceException("Resposta da IA nao contem JSON de correcao");
        }

        AiCorrectionResult result = objectMapper.readValue(resultJson, AiCorrectionResult.class);
        if (result.feedbackGeral() == null || result.feedbackGeral().isBlank()) {
            throw new AiServiceException("Resposta da IA nao contem feedbackGeral");
        }
        if (result.avaliacoesCriterios() == null || result.avaliacoesCriterios().isEmpty()) {
            throw new AiServiceException("Resposta da IA nao contem avaliacoes por criterio");
        }

        return new AiCorrectionResult(
                result.notaTotal(),
                notaMaximaProva,
                calcularPercentual(result.notaTotal(), notaMaximaProva),
                result.feedbackGeral(),
                result.avaliacoesCriterios()
        );
    }

    private String extractOutputText(JsonNode responseJson) {
        JsonNode outputText = responseJson.path("output_text");
        if (outputText.isTextual()) {
            return outputText.asText();
        }

        for (JsonNode outputItem : responseJson.path("output")) {
            for (JsonNode contentItem : outputItem.path("content")) {
                JsonNode text = contentItem.path("text");
                if (text.isTextual()) {
                    return text.asText();
                }
            }
        }

        return null;
    }

    private double calcularPercentual(double notaTotal, double notaMaximaProva) {
        if (notaMaximaProva <= 0) {
            return 0;
        }
        return (notaTotal / notaMaximaProva) * 100;
    }
}
