package redAi.backend.redAi.controller;

import redAi.backend.redAi.model.dto.request.ProvaRequest;
import redAi.backend.redAi.model.dto.response.ProvaResponse;
import redAi.backend.redAi.service.ProvaService;
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

    public AdminController(ProvaService provaService) {
        this.provaService = provaService;
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
}
