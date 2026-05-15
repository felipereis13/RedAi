package redAi.backend.redAi.service.ai;

import redAi.backend.redAi.model.entity.CriterioCorrecao;
import redAi.backend.redAi.model.entity.EspelhoCorrecao;

import java.util.List;

public interface AiCorrectionService {

    AiCorrectionResult correct(
            String texto,
            List<CriterioCorrecao> criterios,
            double notaMaximaProva,
            List<EspelhoCorrecao> espelhos,
            List<EspelhoCorrecao> redacoesModelo
    );
}
