package redAi.backend.redAi.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import redAi.backend.redAi.validation.SemPromptInjection;

public record SubmissaoRedacaoRequest(
        @NotNull(message = "idProva e obrigatorio")
        Long idProva,

        @NotBlank(message = "Tema da redacao e obrigatorio")
        @Size(max = 220, message = "Tema deve ter no maximo 220 caracteres")
        String tema,

        @Size(max = 180, message = "Titulo deve ter no maximo 180 caracteres")
        String titulo,

        @NotBlank(message = "Texto da redacao e obrigatorio")
        @SemPromptInjection(message = "O texto da redação contém conteúdo não permitido.")
        String texto
) {
}
