package redAi.backend.redAi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import redAi.backend.redAi.exception.BusinessException;
import redAi.backend.redAi.exception.ResourceNotFoundException;
import redAi.backend.redAi.model.dto.request.SubmissaoRedacaoRequest;
import redAi.backend.redAi.model.dto.response.RedacaoResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.model.entity.StatusRedacao;
import redAi.backend.redAi.model.entity.User;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.RedacaoRepository;
import redAi.backend.redAi.repository.ResultadoCorrecaoRepository;
import redAi.backend.redAi.repository.UserRepository;
import redAi.backend.redAi.service.ai.AiCorrectionResult;
import redAi.backend.redAi.service.ai.AiCorrectionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RedacaoService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RedacaoService.class);

    private final RedacaoRepository redacaoRepository;
    private final ResultadoCorrecaoRepository resultadoCorrecaoRepository;
    private final ConfiguracaoProvaRepository provaRepository;
    private final UserRepository userRepository;
    private final AiCorrectionService aiCorrectionService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RedacaoService(
            RedacaoRepository redacaoRepository,
            ResultadoCorrecaoRepository resultadoCorrecaoRepository,
            ConfiguracaoProvaRepository provaRepository,
            UserRepository userRepository,
            AiCorrectionService aiCorrectionService
    ) {
        this.redacaoRepository = redacaoRepository;
        this.resultadoCorrecaoRepository = resultadoCorrecaoRepository;
        this.provaRepository = provaRepository;
        this.userRepository = userRepository;
        this.aiCorrectionService = aiCorrectionService;
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
                .status(StatusRedacao.PENDENTE)
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

            AiCorrectionResult result = aiCorrectionService.correct(
                    redacao.getTexto(),
                    prova.getCriterios(),
                    prova.getNotaMaxima()
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

    private User buscarCandidato(String candidatoEmail) {
        return userRepository.findByEmail(candidatoEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Candidato nao encontrado"));
    }

    private String toJson(AiCorrectionResult result) {
        try {
            return objectMapper.writeValueAsString(result.avaliacoesCriterios());
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
