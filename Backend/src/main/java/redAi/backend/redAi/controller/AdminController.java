package redAi.backend.redAi.controller;

import redAi.backend.redAi.model.dto.request.ProvaRequest;
import redAi.backend.redAi.model.dto.request.SugestaoTemaRequest;
import redAi.backend.redAi.model.dto.response.ProvaResponse;
import redAi.backend.redAi.model.dto.response.SugestaoTemaResponse;
import redAi.backend.redAi.service.ProvaService;
import redAi.backend.redAi.service.SugestaoTemaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ProvaService provaService;
    private final SugestaoTemaService sugestaoTemaService;

    public AdminController(ProvaService provaService, SugestaoTemaService sugestaoTemaService) {
        this.provaService = provaService;
        this.sugestaoTemaService = sugestaoTemaService;
    }

    @GetMapping("/provas")
    public ResponseEntity<List<ProvaResponse>> listarProvas() {
        return ResponseEntity.ok(provaService.listarTodas());
    }

    @PostMapping("/provas")
    public ResponseEntity<ProvaResponse> criarProva(@Valid @RequestBody ProvaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(provaService.criar(request));
    }

    @PutMapping("/provas/{id}")
    public ResponseEntity<ProvaResponse> atualizarProva(
            @PathVariable Long id,
            @Valid @RequestBody ProvaRequest request
    ) {
        return ResponseEntity.ok(provaService.atualizar(id, request));
    }

    @DeleteMapping("/provas/{id}")
    public ResponseEntity<Void> desativarProva(@PathVariable Long id) {
        provaService.desativar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/provas/{idProva}/sugestoes")
    public ResponseEntity<List<SugestaoTemaResponse>> listarSugestoes(@PathVariable Long idProva) {
        return ResponseEntity.ok(sugestaoTemaService.listarAdmin(idProva));
    }

    @PostMapping("/provas/{idProva}/sugestoes")
    public ResponseEntity<SugestaoTemaResponse> criarSugestao(
            @PathVariable Long idProva,
            @Valid @RequestBody SugestaoTemaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sugestaoTemaService.criar(idProva, request));
    }

    @PutMapping("/provas/{idProva}/sugestoes/{id}")
    public ResponseEntity<SugestaoTemaResponse> atualizarSugestao(
            @PathVariable Long idProva,
            @PathVariable Long id,
            @Valid @RequestBody SugestaoTemaRequest request
    ) {
        return ResponseEntity.ok(sugestaoTemaService.atualizar(idProva, id, request));
    }

    @DeleteMapping("/provas/{idProva}/sugestoes/{id}")
    public ResponseEntity<Void> desativarSugestao(@PathVariable Long idProva, @PathVariable Long id) {
        sugestaoTemaService.desativar(idProva, id);
        return ResponseEntity.noContent().build();
    }
}
