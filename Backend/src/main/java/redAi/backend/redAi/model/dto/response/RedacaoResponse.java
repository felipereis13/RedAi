package redAi.backend.redAi.model.dto.response;

import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.StatusRedacao;

import java.time.OffsetDateTime;

public record RedacaoResponse(
        Long id,
        Long idProva,
        String titulo,
        String tema,
        String texto,
        StatusRedacao status,
        int tentativas,
        OffsetDateTime createdAt,
        ResultadoResponse resultado
) {

    public static RedacaoResponse fromEntity(Redacao redacao, ObjectMapper objectMapper) {
        return new RedacaoResponse(
                redacao.getId(),
                redacao.getProva().getId(),
                redacao.getTitulo(),
                redacao.getTema(),
                redacao.getTexto(),
                redacao.getStatus(),
                redacao.getTentativas(),
                redacao.getCreatedAt(),
                redacao.getResultado() == null ? null : ResultadoResponse.fromEntity(redacao.getResultado(), objectMapper)
        );
    }
}
