package redAi.backend.redAi.controller;

import redAi.backend.redAi.model.dto.request.SubmissaoRedacaoRequest;
import redAi.backend.redAi.model.dto.response.ProvaResponse;
import redAi.backend.redAi.model.dto.response.RedacaoResponse;
import redAi.backend.redAi.model.dto.response.SugestaoTemaResponse;
import redAi.backend.redAi.service.ProvaService;
import redAi.backend.redAi.service.RedacaoService;
import redAi.backend.redAi.service.SugestaoTemaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/candidato")
public class CandidatoController {

    private final RedacaoService redacaoService;
    private final ProvaService provaService;
    private final SugestaoTemaService sugestaoTemaService;

    public CandidatoController(
            RedacaoService redacaoService,
            ProvaService provaService,
            SugestaoTemaService sugestaoTemaService
    ) {
        this.redacaoService = redacaoService;
        this.provaService = provaService;
        this.sugestaoTemaService = sugestaoTemaService;
    }

    @GetMapping("/provas")
    public ResponseEntity<List<ProvaResponse>> listarProvas() {
        return ResponseEntity.ok(provaService.listarAtivas());
    }

    @GetMapping("/provas/{idProva}/sugestoes")
    public ResponseEntity<List<SugestaoTemaResponse>> listarSugestoes(@PathVariable Long idProva) {
        return ResponseEntity.ok(sugestaoTemaService.listarAtivas(idProva));
    }

    @PostMapping("/redacoes")
    public ResponseEntity<RedacaoResponse> submeterRedacao(
            Authentication authentication,
            @Valid @RequestBody SubmissaoRedacaoRequest request
    ) {
        RedacaoResponse response = redacaoService.submeter(authentication.getName(), request);
        redacaoService.processarCorrecaoAsync(response.id());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/redacoes/{id}")
    public ResponseEntity<RedacaoResponse> buscarRedacao(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(redacaoService.buscarPorId(authentication.getName(), id));
    }

    @PostMapping("/redacoes/{id}/reenviar")
    public ResponseEntity<RedacaoResponse> reenviarRedacao(Authentication authentication, @PathVariable Long id) {
        RedacaoResponse response = redacaoService.reenviar(authentication.getName(), id);
        redacaoService.processarCorrecaoAsync(response.id());
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
    }

    @GetMapping("/redacoes")
    public ResponseEntity<List<RedacaoResponse>> listarRedacoes(Authentication authentication) {
        return ResponseEntity.ok(redacaoService.listar(authentication.getName()));
    }
}
