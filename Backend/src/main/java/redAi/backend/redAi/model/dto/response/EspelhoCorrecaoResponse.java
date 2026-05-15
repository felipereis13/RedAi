package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.EspelhoCorrecao;
import redAi.backend.redAi.model.entity.TipoEspelhoCorrecao;

import java.time.LocalDateTime;

public record EspelhoCorrecaoResponse(
        Long id,
        String titulo,
        TipoEspelhoCorrecao tipo,
        int ordem,
        boolean temTexto,
        boolean temArquivo,
        String nomeArquivo,
        LocalDateTime createdAt
) {

    public static EspelhoCorrecaoResponse fromEntity(EspelhoCorrecao espelho) {
        return new EspelhoCorrecaoResponse(
                espelho.getId(),
                espelho.getTitulo(),
                espelho.getTipo(),
                espelho.getOrdem(),
                espelho.getConteudoTexto() != null && !espelho.getConteudoTexto().isBlank(),
                espelho.getCaminhoArquivo() != null && !espelho.getCaminhoArquivo().isBlank(),
                espelho.getNomeArquivo(),
                espelho.getCreatedAt()
        );
    }
}
