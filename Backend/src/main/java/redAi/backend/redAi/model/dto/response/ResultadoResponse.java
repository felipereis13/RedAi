package redAi.backend.redAi.model.dto.response;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.service.ai.AiCorrectionResult;
import redAi.backend.redAi.service.ai.AvaliacaoCriterio;

import java.io.IOException;
import java.util.List;

public record ResultadoResponse(
        Long id,
        double notaTotal,
        double notaMaximaProva,
        double percentualAproveitamento,
        String feedbackGeral,
        String redacaoCorrigida,
        List<AvaliacaoCriterio> avaliacoesCriterios
) {

    public static ResultadoResponse fromEntity(ResultadoCorrecao resultado, ObjectMapper objectMapper) {
        return new ResultadoResponse(
                resultado.getId(),
                resultado.getNotaTotal(),
                resultado.getNotaMaximaProva(),
                resultado.getPercentualAproveitamento(),
                resultado.getFeedbackGeral(),
                parseRedacaoCorrigida(resultado.getAvaliacoesCriterios(), objectMapper),
                parseAvaliacoes(resultado.getAvaliacoesCriterios(), objectMapper)
        );
    }

    private static List<AvaliacaoCriterio> parseAvaliacoes(String avaliacoesCriterios, ObjectMapper objectMapper) {
        try {
            if (objectMapper.readTree(avaliacoesCriterios).isArray()) {
                return objectMapper.readValue(avaliacoesCriterios, new TypeReference<>() {
                });
            }
            AiCorrectionResult result = objectMapper.readValue(avaliacoesCriterios, AiCorrectionResult.class);
            return result.avaliacoesCriterios();
        } catch (IOException exception) {
            throw new IllegalStateException("Nao foi possivel ler as avaliacoes da correcao", exception);
        }
    }

    private static String parseRedacaoCorrigida(String avaliacoesCriterios, ObjectMapper objectMapper) {
        try {
            if (objectMapper.readTree(avaliacoesCriterios).isArray()) {
                return null;
            }
            AiCorrectionResult result = objectMapper.readValue(avaliacoesCriterios, AiCorrectionResult.class);
            return result.redacaoCorrigida();
        } catch (IOException exception) {
            throw new IllegalStateException("Nao foi possivel ler a redacao corrigida", exception);
        }
    }
}
