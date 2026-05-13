package redAi.backend.redAi.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import redAi.backend.redAi.model.entity.CriterioCorrecao;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class AiCorrectionServiceImpl implements AiCorrectionService {

    @Value("${ai.api-key}")
    private String apiKey;

    @Value("${ai.api-url}")
    private String apiUrl;

    @Value("${ai.model}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public AiCorrectionResult correct(String texto, List<CriterioCorrecao> criterios, double notaMaximaProva) {
        try {
            String prompt = buildPrompt(texto, criterios, notaMaximaProva);

            // Gemini aceita formato compatível com OpenAI via
            // /v1beta/openai/chat/completions
            // Código novo
            String requestBody = objectMapper.writeValueAsString(new ChatRequest(
                    model,
                    8192, // Aumentado para garantir que o JSON retorne completo
                    List.of(new ChatMessage("user", prompt))));
            // Mantemos a rota /openai/chat/completions, mas removemos o ?key= da URL
            String fullUrl = String.format("%s/openai/chat/completions", apiUrl.trim());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(fullUrl))
                    .header("Content-Type", "application/json")
                    // Adicionamos de volta o header de Autorização com o Bearer token
                    .header("Authorization", "Bearer " + apiKey.trim())
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // 1. ADICIONE ESTA VALIDAÇÃO: Se não for 200 OK, imprime o erro real do Google
            // e interrompe.
            if (response.statusCode() != 200) {
                System.err.println("ERRO RETORNADO PELO GOOGLE: " + response.body());
                throw new RuntimeException(
                        "Falha na API do Google (Status " + response.statusCode() + "): " + response.body());
            }
            var responseJson = objectMapper.readTree(response.body());
            String content = responseJson
                    .get("choices").get(0)
                    .get("message")
                    .get("content")
                    .asText();

            content = content.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();

            // Adicione esta linha para ver exatamente o que a IA respondeu
            System.out.println("JSON DA IA: \n" + content);

            return objectMapper.readValue(content, AiCorrectionResult.class);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao chamar a IA para correção", e);
        }
    }

    private String buildPrompt(String texto, List<CriterioCorrecao> criterios, double notaMaximaProva) {
        StringBuilder sb = new StringBuilder();

        sb.append(
                "Você é um corretor especialista de redações. Corrija a redação abaixo com base nos critérios fornecidos.\n\n");
        sb.append("REDAÇÃO:\n").append(texto).append("\n\n");
        sb.append("CRITÉRIOS DE CORREÇÃO:\n");

        for (CriterioCorrecao criterio : criterios) {
            sb.append("- Nome: ").append(criterio.getNome()).append("\n");
            sb.append("  Descrição: ").append(criterio.getDescricao()).append("\n");
            sb.append("  Nota máxima: ").append(criterio.getNotaMaxima()).append("\n");
        }

        sb.append("\nNOTA MÁXIMA TOTAL DA PROVA: ").append(notaMaximaProva).append("\n\n");
        sb.append("""
                Responda APENAS com JSON válido, sem texto adicional, sem markdown. Formato exato:
                {
                  "notaTotal": <número>,
                  "notaMaximaProva": <número>,
                  "percentualAproveitamento": <número entre 0 e 100>,
                  "feedbackGeral": "<texto com feedback geral da redação>",
                  "avaliacoesCriterios": [
                    {
                      "nome": "<nome do critério>",
                      "notaObtida": <número>,
                      "notaMaxima": <número>,
                      "comentario": "<feedback específico do critério>"
                    }
                  ]
                }
                """);
        return sb.toString();
    }

    record ChatRequest(String model, int max_tokens, List<ChatMessage> messages) {
    }

    record ChatMessage(String role, String content) {
    }
}