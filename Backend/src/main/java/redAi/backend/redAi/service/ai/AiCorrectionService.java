package redAi.backend.redAi.service.ai;

import redAi.backend.redAi.model.entity.CriterioCorrecao;

import java.util.List;

public interface AiCorrectionService {

    AiCorrectionResult correct(String texto, List<CriterioCorrecao> criterios, double notaMaximaProva);
}
