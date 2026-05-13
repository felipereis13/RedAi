package redAi.backend.redAi.model.dto.response;

import redAi.backend.redAi.model.entity.CriterioCorrecao;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriterioCorrecaoResponse {

    private Long id;
    private String nome;
    private String descricao;
    private double notaMaxima;

    public static CriterioCorrecaoResponse fromEntity(CriterioCorrecao criterio) {
        return CriterioCorrecaoResponse.builder()
                .id(criterio.getId())
                .nome(criterio.getNome())
                .descricao(criterio.getDescricao())
                .notaMaxima(criterio.getNotaMaxima())
                .build();
    }
}
