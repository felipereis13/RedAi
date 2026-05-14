package redAi.backend.redAi.model.dto.response;

public record DashboardCandidatoResumoResponse(
        long totalRedacoesEnviadas,
        long totalConcluidas,
        double mediaAproveitamento,
        double melhorNota,
        double melhorNotaMaxima
) {
}
