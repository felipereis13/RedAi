package redAi.backend.redAi.model.dto.response;

public record DashboardResumoResponse(
        long totalRedacoesCorrigidas,
        long totalCandidatos,
        long totalProvasAtivas
) {
}
