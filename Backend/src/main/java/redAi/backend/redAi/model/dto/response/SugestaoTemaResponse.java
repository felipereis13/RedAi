package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.SugestaoTema;

public record SugestaoTemaResponse(
        Long id,
        Long idProva,
        String titulo,
        String descricao,
        boolean ativo
) {

    public static SugestaoTemaResponse fromEntity(SugestaoTema sugestao) {
        return new SugestaoTemaResponse(
                sugestao.getId(),
                sugestao.getConfiguracaoProva().getId(),
                sugestao.getTitulo(),
                sugestao.getDescricao(),
                sugestao.isAtivo()
        );
    }
}
