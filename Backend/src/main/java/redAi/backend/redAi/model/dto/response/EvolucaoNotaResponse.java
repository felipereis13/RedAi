package redAi.backend.redAi.model.dto.response;

import java.time.LocalDate;

public record EvolucaoNotaResponse(
        LocalDate data,
        double percentualAproveitamento,
        double notaTotal,
        double notaMaximaProva
) {
}
