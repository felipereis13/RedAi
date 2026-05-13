package redAi.backend.redAi.service.ai;

import java.util.List;

public record AiCorrectionResult(
        double notaTotal,
        double notaMaximaProva,
        double percentualAproveitamento,
        String feedbackGeral,
        List<AvaliacaoCriterio> avaliacoesCriterios
) {
}
