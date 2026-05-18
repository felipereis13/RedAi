package redAi.backend.redAi.service;

import redAi.backend.redAi.exception.BusinessException;
import redAi.backend.redAi.exception.ResourceNotFoundException;
import redAi.backend.redAi.model.dto.request.CriterioCorrecaoRequest;
import redAi.backend.redAi.model.dto.request.ProvaRequest;
import redAi.backend.redAi.model.dto.response.ProvaResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.CriterioCorrecao;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.RedacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProvaService {

    private final ConfiguracaoProvaRepository provaRepository;
    private final RedacaoRepository redacaoRepository;

    public ProvaService(ConfiguracaoProvaRepository provaRepository, RedacaoRepository redacaoRepository) {
        this.provaRepository = provaRepository;
        this.redacaoRepository = redacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProvaResponse> listarAtivas() {
        return provaRepository.findByAtivoTrueOrderByIdDesc().stream()
                .map(ProvaResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProvaResponse> listarTodas() {
        return provaRepository.findAllByOrderByIdDesc().stream()
                .map(ProvaResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ProvaResponse criar(ProvaRequest request) {
        validarSomaCriterios(request);

        ConfiguracaoProva prova = ConfiguracaoProva.builder()
                .cargo(request.getCargo().trim())
                .banca(request.getBanca().trim())
                .estado(request.getEstado().trim().toUpperCase())
                .descricao(request.getDescricao())
                .notaMaxima(request.getNotaMaxima())
                .quantidadeLinhas(request.getQuantidadeLinhas())
                .ativo(true)
                .build();

        substituirCriterios(prova, request.getCriterios());

        return ProvaResponse.fromEntity(provaRepository.save(prova));
    }

    @Transactional
    public ProvaResponse atualizar(Long id, ProvaRequest request) {
        validarSomaCriterios(request);

        ConfiguracaoProva prova = buscarPorId(id);
        prova.setCargo(request.getCargo().trim());
        prova.setBanca(request.getBanca().trim());
        prova.setEstado(request.getEstado().trim().toUpperCase());
        prova.setDescricao(request.getDescricao());
        prova.setNotaMaxima(request.getNotaMaxima());
        prova.setQuantidadeLinhas(request.getQuantidadeLinhas());
        prova.setAtivo(true);

        substituirCriterios(prova, request.getCriterios());

        return ProvaResponse.fromEntity(provaRepository.save(prova));
    }

    @Transactional
    public void desativar(Long id) {
        ConfiguracaoProva prova = buscarPorId(id);
        prova.setAtivo(false);
    }

    @Transactional
    public void excluir(Long id) {
        ConfiguracaoProva prova = buscarPorId(id);

        if (redacaoRepository.existsByProvaId(id)) {
            throw new BusinessException("Não é possível excluir uma prova com redações enviadas. Exclua as redações primeiro ou desative a prova.");
        }

        provaRepository.delete(prova);
    }

    private ConfiguracaoProva buscarPorId(Long id) {
        return provaRepository.findWithCriteriosById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prova não encontrada"));
    }

    private void substituirCriterios(ConfiguracaoProva prova, List<CriterioCorrecaoRequest> criteriosRequest) {
        prova.getCriterios().clear();

        criteriosRequest.forEach(criterioRequest -> {
            CriterioCorrecao criterio = CriterioCorrecao.builder()
                    .nome(criterioRequest.getNome().trim())
                    .descricao(criterioRequest.getDescricao().trim())
                    .notaMaxima(criterioRequest.getNotaMaxima())
                    .configuracaoProva(prova)
                    .build();
            prova.getCriterios().add(criterio);
        });
    }

    private void validarSomaCriterios(ProvaRequest request) {
        double somaCriterios = request.getCriterios().stream()
                .mapToDouble(CriterioCorrecaoRequest::getNotaMaxima)
                .sum();

        if (somaCriterios > request.getNotaMaxima()) {
            throw new BusinessException("A soma das notas máximas dos critérios não pode ultrapassar a nota máxima da prova");
        }
    }
}
