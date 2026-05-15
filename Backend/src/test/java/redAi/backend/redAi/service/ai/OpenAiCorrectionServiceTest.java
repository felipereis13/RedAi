package redAi.backend.redAi.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import redAi.backend.redAi.model.entity.CriterioCorrecao;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class OpenAiCorrectionServiceTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpServer server;

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void correctReturnsParsedResultWithCriterionScoresAndFeedback() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        AtomicReference<String> authorizationHeader = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress(0), 0);
        server.createContext("/v1/responses", exchange -> {
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            authorizationHeader.set(exchange.getRequestHeaders().getFirst("Authorization"));
            writeJson(exchange, openAiResponse());
        });
        server.start();

        String apiUrl = "http://localhost:" + server.getAddress().getPort() + "/v1/responses";
        OpenAiCorrectionService service = new OpenAiCorrectionService(
                "test-api-key",
                apiUrl,
                "gpt-5.2"
        );

        AiCorrectionResult result = service.correct(
                "Texto da redacao para correcao.",
                criterios(),
                10.0,
                List.of(),
                List.of()
        );

        assertThat(result.notaTotal()).isEqualTo(8.0);
        assertThat(result.notaMaximaProva()).isEqualTo(10.0);
        assertThat(result.percentualAproveitamento()).isEqualTo(80.0);
        assertThat(result.feedbackGeral()).isEqualTo("Bom dominio do tema, com ajustes pontuais.");
        assertThat(result.redacaoCorrigida()).isEqualTo("Redacao corrigida completa.");
        assertThat(result.avaliacoesCriterios())
                .hasSize(2)
                .extracting(AvaliacaoCriterio::nome)
                .containsExactly("Argumentacao", "Norma culta");

        JsonNode sentRequest = objectMapper.readTree(requestBody.get());
        String instructions = sentRequest.path("instructions").asText();
        assertThat(authorizationHeader.get()).isEqualTo("Bearer test-api-key");
        assertThat(instructions).contains("Argumentacao", "Organizacao das ideias", "notaMaxima: 6.0");
        assertThat(instructions).contains("Norma culta", "Uso adequado da lingua portuguesa", "notaMaxima: 4.0");
        assertThat(instructions).contains("Retorne APENAS JSON valido, sem markdown");
        assertThat(instructions).contains("sugestaoMelhoria", "redacaoCorrigida");
    }

    private List<CriterioCorrecao> criterios() {
        return List.of(
                CriterioCorrecao.builder()
                        .nome("Argumentacao")
                        .descricao("Organizacao das ideias")
                        .notaMaxima(6.0)
                        .build(),
                CriterioCorrecao.builder()
                        .nome("Norma culta")
                        .descricao("Uso adequado da lingua portuguesa")
                        .notaMaxima(4.0)
                        .build()
        );
    }

    private String openAiResponse() throws IOException {
        String correctionJson = objectMapper.writeValueAsString(new AiCorrectionResult(
                8.0,
                10.0,
                80.0,
                "Bom dominio do tema, com ajustes pontuais.",
                "Redacao corrigida completa.",
                List.of(
                        new AvaliacaoCriterio("Argumentacao", 5.0, 6.0, "Argumentos pertinentes.", null),
                        new AvaliacaoCriterio("Norma culta", 3.0, 4.0, "Poucos desvios gramaticais.", null)
                )
        ));

        return objectMapper.writeValueAsString(
                objectMapper.createObjectNode()
                        .put("id", "resp_test")
                        .put("object", "response")
                        .set("output", objectMapper.createArrayNode()
                                .add(objectMapper.createObjectNode()
                                        .put("type", "message")
                                        .set("content", objectMapper.createArrayNode()
                                                .add(objectMapper.createObjectNode()
                                                        .put("type", "output_text")
                                                        .put("text", correctionJson)))))
        );
    }

    private void writeJson(HttpExchange exchange, String responseBody) throws IOException {
        byte[] responseBytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, responseBytes.length);
        exchange.getResponseBody().write(responseBytes);
        exchange.close();
    }
}
