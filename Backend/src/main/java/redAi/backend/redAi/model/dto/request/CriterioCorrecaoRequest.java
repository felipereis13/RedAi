package redAi.backend.redAi.model.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriterioCorrecaoRequest {

    @NotBlank(message = "Nome do critério é obrigatório")
    private String nome;

    @NotBlank(message = "Descrição do critério é obrigatória")
    private String descricao;

    @NotNull(message = "Nota máxima do critério é obrigatória")
    @DecimalMin(value = "0.1", message = "Nota máxima do critério deve ser no mínimo 0.1")
    private Double notaMaxima;
}
