package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvaResponse {

    private Long id;
    private String cargo;
    private String banca;
    private String estado;
    private String descricao;
    private double notaMaxima;
    private boolean ativo;
    private List<CriterioCorrecaoResponse> criterios;

    public static ProvaResponse fromEntity(ConfiguracaoProva prova) {
        return ProvaResponse.builder()
                .id(prova.getId())
                .cargo(prova.getCargo())
                .banca(prova.getBanca())
                .estado(prova.getEstado())
                .descricao(prova.getDescricao())
                .notaMaxima(prova.getNotaMaxima())
                .ativo(prova.isAtivo())
                .criterios(prova.getCriterios().stream()
                        .map(CriterioCorrecaoResponse::fromEntity)
                        .toList())
                .build();
    }
}
