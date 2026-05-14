package redAi.backend.redAi.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SugestaoTemaRequest(
        @NotBlank(message = "Titulo da sugestao e obrigatorio")
        @Size(max = 160, message = "Titulo deve ter no maximo 160 caracteres")
        String titulo,

        String descricao,

        Boolean ativo
) {
}
