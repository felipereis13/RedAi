package redAi.backend.redAi.model.dto.response;

public record EvolucaoCandidatoResponse(
        String data,
        double percentualAproveitamento,
        double notaTotal,
        double notaMaximaProva
) {
}
