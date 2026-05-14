package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.StatusRedacao;

import java.time.OffsetDateTime;

public record UltimaRedacaoCandidatoResponse(
        Long id,
        String titulo,
        String tema,
        String cargo,
        String banca,
        StatusRedacao status,
        Double notaTotal,
        Double notaMaximaProva,
        Double percentualAproveitamento,
        OffsetDateTime createdAt
) {
}
