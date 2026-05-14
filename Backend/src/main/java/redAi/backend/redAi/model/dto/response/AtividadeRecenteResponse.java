package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.StatusRedacao;

import java.time.OffsetDateTime;

public record AtividadeRecenteResponse(
        String nomeCandidato,
        String cargo,
        String banca,
        StatusRedacao status,
        Double notaTotal,
        Double percentualAproveitamento,
        OffsetDateTime createdAt
) {
}
