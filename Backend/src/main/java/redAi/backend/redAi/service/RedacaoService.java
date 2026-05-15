package redAi.backend.redAi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.exception.BusinessException;
import redAi.backend.redAi.exception.ResourceNotFoundException;
import redAi.backend.redAi.model.dto.request.SubmissaoRedacaoRequest;
import redAi.backend.redAi.model.dto.response.EvolucaoNotaResponse;
import redAi.backend.redAi.model.dto.response.HistoricoRedacaoResponse;
import redAi.backend.redAi.model.dto.response.RedacaoResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.EspelhoCorrecao;
import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.model.entity.StatusRedacao;
import redAi.backend.redAi.model.entity.TipoEspelhoCorrecao;
import redAi.backend.redAi.model.entity.User;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.EspelhoCorrecaoRepository;
import redAi.backend.redAi.repository.RedacaoRepository;
import redAi.backend.redAi.repository.ResultadoCorrecaoRepository;
import redAi.backend.redAi.repository.UserRepository;
import redAi.backend.redAi.service.ai.AiCorrectionResult;
import redAi.backend.redAi.service.ai.AiCorrectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class RedacaoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedacaoService.class);
    private static final int LIMITE_TENTATIVAS = 3;
    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    private final RedacaoRepository redacaoRepository;
    private final ResultadoCorrecaoRepository resultadoCorrecaoRepository;
    private final ConfiguracaoProvaRepository provaRepository;
    private final UserRepository userRepository;
    private final AiCorrectionService aiCorrectionService;
    private final EspelhoCorrecaoRepository espelhoCorrecaoRepository;
    private final TextoSanitizador textoSanitizador;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RedacaoService(
            RedacaoRepository redacaoRepository,
            ResultadoCorrecaoRepository resultadoCorrecaoRepository,
            ConfiguracaoProvaRepository provaRepository,
            UserRepository userRepository,
            AiCorrectionService aiCorrectionService,
            EspelhoCorrecaoRepository espelhoCorrecaoRepository,
            TextoSanitizador textoSanitizador
    ) {
        this.redacaoRepository = redacaoRepository;
        this.resultadoCorrecaoRepository = resultadoCorrecaoRepository;
        this.provaRepository = provaRepository;
        this.userRepository = userRepository;
        this.aiCorrectionService = aiCorrectionService;
        this.espelhoCorrecaoRepository = espelhoCorrecaoRepository;
        this.textoSanitizador = textoSanitizador;
    }

    @Transactional
    public RedacaoResponse submeter(String candidatoEmail, SubmissaoRedacaoRequest request) {
        User candidato = buscarCandidato(candidatoEmail);
        ConfiguracaoProva prova = provaRepository.findWithCriteriosById(request.idProva())
                .orElseThrow(() -> new ResourceNotFoundException("Prova nao encontrada"));

        if (!prova.isAtivo()) {
            throw new BusinessException("Prova inativa nao aceita novas redacoes");
        }

        Redacao redacao = Redacao.builder()
                .texto(request.texto().trim())
                .titulo(resolveTitulo(request))
                .tema(request.tema().trim())
                .status(StatusRedacao.PENDENTE)
                .tentativas(0)
                .candidato(candidato)
                .prova(prova)
                .build();

        return RedacaoResponse.fromEntity(redacaoRepository.save(redacao), objectMapper);
    }

    @Async
    public void processarCorrecaoAsync(Long redacaoId) {
        Redacao redacao = redacaoRepository.findById(redacaoId)
                .orElseThrow(() -> new ResourceNotFoundException("Redacao nao encontrada"));

        try {
            redacao.setStatus(StatusRedacao.PROCESSANDO);
            redacaoRepository.saveAndFlush(redacao);

            ConfiguracaoProva prova = provaRepository.findWithCriteriosById(redacao.getProva().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prova nao encontrada"));
            List<EspelhoCorrecao> espelhos = espelhoCorrecaoRepository.findByConfiguracaoProvaIdAndTipoOrderByOrdemAsc(
                    prova.getId(),
                    TipoEspelhoCorrecao.ESPELHO
            );
            List<EspelhoCorrecao> redacoesModelo = espelhoCorrecaoRepository.findByConfiguracaoProvaIdAndTipoOrderByOrdemAsc(
                    prova.getId(),
                    TipoEspelhoCorrecao.REDACAO_MODELO
            );
            String textoSanitizado = textoSanitizador.sanitizar(redacao.getId(), redacao.getTexto());

            AiCorrectionResult result = aiCorrectionService.correct(
                    textoSanitizado,
                    prova.getCriterios(),
                    prova.getNotaMaxima(),
                    espelhos,
                    redacoesModelo
            );

            ResultadoCorrecao resultado = ResultadoCorrecao.builder()
                    .notaTotal(result.notaTotal())
                    .notaMaximaProva(prova.getNotaMaxima())
                    .percentualAproveitamento(calcularPercentual(result.notaTotal(), prova.getNotaMaxima()))
                    .feedbackGeral(result.feedbackGeral())
                    .avaliacoesCriterios(toJson(result))
                    .redacao(redacao)
                    .build();

            resultadoCorrecaoRepository.save(resultado);
            redacao.setResultado(resultado);
            redacao.setStatus(StatusRedacao.CONCLUIDA);
            redacaoRepository.save(redacao);
        } catch (Exception exception) {
            redacao.setStatus(StatusRedacao.ERRO);
            redacaoRepository.save(redacao);
            LOGGER.error("Erro ao processar correcao da redacao {}", redacaoId, exception);
        }
    }

    @Transactional(readOnly = true)
    public RedacaoResponse buscarPorId(String candidatoEmail, Long id) {
        Redacao redacao = redacaoRepository.findByIdAndCandidatoEmail(id, candidatoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Redacao nao encontrada"));
        return RedacaoResponse.fromEntity(redacao, objectMapper);
    }

    @Transactional(readOnly = true)
    public List<RedacaoResponse> listar(String candidatoEmail) {
        return redacaoRepository.findByCandidatoEmailOrderByIdDesc(candidatoEmail).stream()
                .map(redacao -> RedacaoResponse.fromEntity(redacao, objectMapper))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<HistoricoRedacaoResponse> historico(
            String candidatoEmail,
            Long idProva,
            String status,
            Pageable pageable
    ) {
        StatusRedacao statusRedacao = parseStatus(status);
        return redacaoRepository.buscarHistorico(candidatoEmail, idProva, statusRedacao, pageable)
                .map(this::toHistoricoResponse);
    }

    @Transactional(readOnly = true)
    public List<EvolucaoNotaResponse> evolucao(String candidatoEmail, Long idProva) {
        return redacaoRepository.buscarEvolucao(
                        candidatoEmail,
                        StatusRedacao.CONCLUIDA,
                        idProva,
                        PageRequest.of(0, 30)
                ).stream()
                .filter(redacao -> redacao.getResultado() != null)
                .map(this::toEvolucaoResponse)
                .toList();
    }

    @Transactional
    public RedacaoResponse reenviar(String candidatoEmail, Long id) {
        Redacao redacao = redacaoRepository.findWithCandidatoAndResultadoById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Redacao nao encontrada"));

        if (!redacao.getCandidato().getEmail().equals(candidatoEmail)) {
            throw new AccessDeniedException("Redacao pertence a outro candidato");
        }

        if (redacao.getStatus() != StatusRedacao.ERRO) {
            throw new BusinessException("Apenas redacoes com erro podem ser reenviadas");
        }

        if (redacao.getTentativas() >= LIMITE_TENTATIVAS) {
            throw new BusinessException("Limite de tentativas atingido");
        }

        if (redacao.getResultado() != null) {
            resultadoCorrecaoRepository.deleteByRedacaoId(redacao.getId());
            redacao.setResultado(null);
        }

        redacao.setTentativas(redacao.getTentativas() + 1);
        redacao.setStatus(StatusRedacao.PENDENTE);

        return RedacaoResponse.fromEntity(redacaoRepository.save(redacao), objectMapper);
    }

    private User buscarCandidato(String candidatoEmail) {
        return userRepository.findByEmail(candidatoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato nao encontrado"));
    }

    private HistoricoRedacaoResponse toHistoricoResponse(Redacao redacao) {
        ResultadoCorrecao resultado = redacao.getResultado();
        ConfiguracaoProva prova = redacao.getProva();

        return new HistoricoRedacaoResponse(
                redacao.getId(),
                redacao.getTitulo(),
                redacao.getTema(),
                prova.getCargo(),
                prova.getBanca(),
                prova.getEstado(),
                redacao.getStatus(),
                resultado == null ? null : resultado.getNotaTotal(),
                resultado == null ? null : resultado.getNotaMaximaProva(),
                resultado == null ? null : resultado.getPercentualAproveitamento(),
                redacao.getCreatedAt()
        );
    }

    private EvolucaoNotaResponse toEvolucaoResponse(Redacao redacao) {
        ResultadoCorrecao resultado = redacao.getResultado();
        LocalDate data = redacao.getCreatedAt().atZoneSameInstant(ZONE_ID).toLocalDate();

        return new EvolucaoNotaResponse(
                data,
                resultado.getPercentualAproveitamento(),
                resultado.getNotaTotal(),
                resultado.getNotaMaximaProva()
        );
    }

    private StatusRedacao parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return StatusRedacao.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BusinessException("Status de redacao invalido");
        }
    }

    private String resolveTitulo(SubmissaoRedacaoRequest request) {
        if (request.titulo() != null && !request.titulo().isBlank()) {
            return request.titulo().trim();
        }

        String tema = request.tema().trim();
        return tema.length() <= 180 ? tema : tema.substring(0, 180);
    }

    private String toJson(AiCorrectionResult result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel serializar as avaliacoes da IA", exception);
        }
    }

    private double calcularPercentual(double notaTotal, double notaMaximaProva) {
        if (notaMaximaProva <= 0) {
            return 0;
        }
        return (notaTotal / notaMaximaProva) * 100;
    }
}
