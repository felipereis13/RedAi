package redAi.backend.redAi.model.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProvaRequest {

    @NotBlank(message = "Cargo é obrigatório")
    private String cargo;

    @NotBlank(message = "Banca é obrigatória")
    private String banca;

    @NotBlank(message = "Estado é obrigatório")
    private String estado;

    private String descricao;

    @NotNull(message = "Nota máxima da prova é obrigatória")
    @Positive(message = "Nota máxima da prova deve ser positiva")
    private Double notaMaxima;

    @Builder.Default
    @Valid
    @NotNull(message = "Critérios são obrigatórios")
    private List<CriterioCorrecaoRequest> criterios = new ArrayList<>();
}
