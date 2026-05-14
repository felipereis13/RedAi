package redAi.backend.redAi.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmissaoRedacaoRequest(
        @NotNull(message = "idProva e obrigatorio")
        Long idProva,

        @NotBlank(message = "Tema da redacao e obrigatorio")
        @Size(max = 220, message = "Tema deve ter no maximo 220 caracteres")
        String tema,

        @NotBlank(message = "Titulo da redacao e obrigatorio")
        @Size(max = 180, message = "Titulo deve ter no maximo 180 caracteres")
        String titulo,

        @NotBlank(message = "Texto da redacao e obrigatorio")
        @Size(max = 5000, message = "Texto da redacao deve ter no maximo 5000 caracteres")
        String texto
) {
}
