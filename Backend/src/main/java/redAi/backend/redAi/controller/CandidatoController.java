package redAi.backend.redAi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import redAi.backend.redAi.model.dto.request.SubmissaoRedacaoRequest;
import redAi.backend.redAi.model.dto.response.EvolucaoNotaResponse;
import redAi.backend.redAi.model.dto.response.HistoricoRedacaoResponse;
import redAi.backend.redAi.model.dto.response.ProvaResponse;
import redAi.backend.redAi.model.dto.response.RedacaoResponse;
import redAi.backend.redAi.model.dto.response.SugestaoTemaResponse;
import redAi.backend.redAi.service.ProvaService;
import redAi.backend.redAi.service.RedacaoService;
import redAi.backend.redAi.service.SugestaoTemaService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    @Operation(summary = "Lista o historico paginado de redacoes do candidato")
    @GetMapping("/redacoes/historico")
    public ResponseEntity<Page<HistoricoRedacaoResponse>> historicoRedacoes(
            Authentication authentication,
            @Parameter(description = "Filtra por prova") @RequestParam(required = false) Long idProva,
            @Parameter(description = "Filtra por status: PENDENTE, PROCESSANDO, CONCLUIDA ou ERRO")
            @RequestParam(required = false) String status,
            @Parameter(description = "Numero da pagina, iniciando em 0")
            @RequestParam(defaultValue = "0") int pagina,
            @Parameter(description = "Quantidade de itens por pagina")
            @RequestParam(defaultValue = "10") int tamanho
    ) {
        int paginaSegura = Math.max(0, pagina);
        int tamanhoSeguro = Math.max(1, Math.min(tamanho, 100));
        PageRequest pageable = PageRequest.of(
                paginaSegura,
                tamanhoSeguro,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(redacaoService.historico(
                authentication.getName(),
                idProva,
                status,
                pageable
        ));
    }

    @Operation(summary = "Lista a evolucao de notas do candidato")
    @GetMapping("/redacoes/evolucao")
    public ResponseEntity<List<EvolucaoNotaResponse>> evolucaoRedacoes(
            Authentication authentication,
            @Parameter(description = "Filtra por prova") @RequestParam(required = false) Long idProva
    ) {
        return ResponseEntity.ok(redacaoService.evolucao(authentication.getName(), idProva));
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
