package redAi.backend.redAi.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmissaoRedacaoRequest(
        @NotNull(message = "idProva e obrigatorio")
        Long idProva,

        @NotBlank(message = "Texto da redacao e obrigatorio")
        @Size(max = 5000, message = "Texto da redacao deve ter no maximo 5000 caracteres")
        String texto
) {
}
