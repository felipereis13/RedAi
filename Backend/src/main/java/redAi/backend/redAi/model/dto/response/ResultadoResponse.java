package redAi.backend.redAi.model.dto.response;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.service.ai.AvaliacaoCriterio;

import java.io.IOException;
import java.util.List;

public record ResultadoResponse(
        Long id,
        double notaTotal,
        double notaMaximaProva,
        double percentualAproveitamento,
        String feedbackGeral,
        List<AvaliacaoCriterio> avaliacoesCriterios
) {

    public static ResultadoResponse fromEntity(ResultadoCorrecao resultado, ObjectMapper objectMapper) {
        return new ResultadoResponse(
                resultado.getId(),
                resultado.getNotaTotal(),
                resultado.getNotaMaximaProva(),
                resultado.getPercentualAproveitamento(),
                resultado.getFeedbackGeral(),
                parseAvaliacoes(resultado.getAvaliacoesCriterios(), objectMapper)
        );
    }

    private static List<AvaliacaoCriterio> parseAvaliacoes(String avaliacoesCriterios, ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(avaliacoesCriterios, new TypeReference<>() {
            });
        } catch (IOException exception) {
            throw new IllegalStateException("Nao foi possivel ler as avaliacoes da correcao", exception);
        }
    }
}
