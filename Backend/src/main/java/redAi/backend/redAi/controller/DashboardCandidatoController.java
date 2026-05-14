package redAi.backend.redAi.controller;

import redAi.backend.redAi.model.dto.response.DashboardCandidatoResumoResponse;
import redAi.backend.redAi.model.dto.response.EvolucaoCandidatoResponse;
import redAi.backend.redAi.model.dto.response.UltimaRedacaoCandidatoResponse;
import redAi.backend.redAi.service.DashboardCandidatoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/candidato/dashboard")
public class DashboardCandidatoController {

    private final DashboardCandidatoService dashboardCandidatoService;

    public DashboardCandidatoController(DashboardCandidatoService dashboardCandidatoService) {
        this.dashboardCandidatoService = dashboardCandidatoService;
    }

    @GetMapping("/resumo")
    public ResponseEntity<DashboardCandidatoResumoResponse> resumo(Authentication authentication) {
        return ResponseEntity.ok(dashboardCandidatoService.resumo(authentication.getName()));
    }

    @GetMapping("/evolucao")
    public ResponseEntity<List<EvolucaoCandidatoResponse>> evolucao(Authentication authentication) {
        return ResponseEntity.ok(dashboardCandidatoService.evolucao(authentication.getName()));
    }

    @GetMapping("/ultimas-redacoes")
    public ResponseEntity<List<UltimaRedacaoCandidatoResponse>> ultimasRedacoes(Authentication authentication) {
        return ResponseEntity.ok(dashboardCandidatoService.ultimasRedacoes(authentication.getName()));
    }
}
