package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.StatusRedacao;

import java.time.OffsetDateTime;

public record HistoricoRedacaoResponse(
        Long id,
        String titulo,
        String tema,
        String cargo,
        String banca,
        String estado,
        StatusRedacao status,
        Double notaTotal,
        Double notaMaximaProva,
        Double percentualAproveitamento,
        OffsetDateTime createdAt
) {
}
