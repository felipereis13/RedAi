package redAi.backend.redAi.controller;

import redAi.backend.redAi.model.dto.response.AtividadeRecenteResponse;
import redAi.backend.redAi.model.dto.response.DashboardResumoResponse;
import redAi.backend.redAi.model.dto.response.RankingProvaResponse;
import redAi.backend.redAi.model.dto.response.RedacoesPorDiaResponse;
import redAi.backend.redAi.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<DashboardResumoResponse> resumo() {
        return ResponseEntity.ok(dashboardService.resumo());
    }

    @GetMapping("/redacoes-por-dia")
    public ResponseEntity<List<RedacoesPorDiaResponse>> redacoesPorDia() {
        return ResponseEntity.ok(dashboardService.redacoesPorDia());
    }

    @GetMapping("/ranking-provas")
    public ResponseEntity<List<RankingProvaResponse>> rankingProvas() {
        return ResponseEntity.ok(dashboardService.rankingProvas());
    }

    @GetMapping("/atividade-recente")
    public ResponseEntity<List<AtividadeRecenteResponse>> atividadeRecente() {
        return ResponseEntity.ok(dashboardService.atividadeRecente());
    }
}
