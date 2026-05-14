package redAi.backend.redAi.service;

import redAi.backend.redAi.model.dto.response.DashboardCandidatoResumoResponse;
import redAi.backend.redAi.model.dto.response.EvolucaoCandidatoResponse;
import redAi.backend.redAi.model.dto.response.UltimaRedacaoCandidatoResponse;
import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.model.entity.StatusRedacao;
import redAi.backend.redAi.repository.RedacaoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Service
public class DashboardCandidatoService {

    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DIA_MES_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    private final RedacaoRepository redacaoRepository;

    public DashboardCandidatoService(RedacaoRepository redacaoRepository) {
        this.redacaoRepository = redacaoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardCandidatoResumoResponse resumo(String candidatoEmail) {
        List<Redacao> redacoes = redacaoRepository.findByCandidatoEmailOrderByIdDesc(candidatoEmail);
        List<ResultadoCorrecao> resultados = redacoes.stream()
                .map(Redacao::getResultado)
                .filter(resultado -> resultado != null)
                .toList();

        double media = resultados.stream()
                .mapToDouble(ResultadoCorrecao::getPercentualAproveitamento)
                .average()
                .orElse(0);

        ResultadoCorrecao melhorResultado = resultados.stream()
                .max(Comparator.comparingDouble(ResultadoCorrecao::getNotaTotal))
                .orElse(null);

        return new DashboardCandidatoResumoResponse(
                redacoes.size(),
                resultados.size(),
                media,
                melhorResultado == null ? 0 : melhorResultado.getNotaTotal(),
                melhorResultado == null ? 0 : melhorResultado.getNotaMaximaProva()
        );
    }

    @Transactional(readOnly = true)
    public List<EvolucaoCandidatoResponse> evolucao(String candidatoEmail) {
        List<Redacao> concluidas = redacaoRepository.findByCandidatoEmailAndStatusOrderByCreatedAtAsc(
                candidatoEmail,
                StatusRedacao.CONCLUIDA
        );

        return concluidas.stream()
                .skip(Math.max(0, concluidas.size() - 10))
                .filter(redacao -> redacao.getResultado() != null)
                .map(redacao -> {
                    ResultadoCorrecao resultado = redacao.getResultado();
                    return new EvolucaoCandidatoResponse(
                            redacao.getCreatedAt().atZoneSameInstant(ZONE_ID).format(DIA_MES_FORMATTER),
                            resultado.getPercentualAproveitamento(),
                            resultado.getNotaTotal(),
                            resultado.getNotaMaximaProva()
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UltimaRedacaoCandidatoResponse> ultimasRedacoes(String candidatoEmail) {
        return redacaoRepository.findTop5ByCandidatoEmailOrderByCreatedAtDesc(candidatoEmail).stream()
                .map(this::toUltimaRedacao)
                .toList();
    }

    private UltimaRedacaoCandidatoResponse toUltimaRedacao(Redacao redacao) {
        ResultadoCorrecao resultado = redacao.getResultado();
        return new UltimaRedacaoCandidatoResponse(
                redacao.getId(),
                redacao.getTitulo(),
                redacao.getTema(),
                redacao.getProva().getCargo(),
                redacao.getProva().getBanca(),
                redacao.getStatus(),
                resultado == null ? null : resultado.getNotaTotal(),
                resultado == null ? null : resultado.getNotaMaximaProva(),
                resultado == null ? null : resultado.getPercentualAproveitamento(),
                redacao.getCreatedAt()
        );
    }
}
