package redAi.backend.redAi.service;

import redAi.backend.redAi.model.dto.response.AtividadeRecenteResponse;
import redAi.backend.redAi.model.dto.response.DashboardResumoResponse;
import redAi.backend.redAi.model.dto.response.RankingProvaResponse;
import redAi.backend.redAi.model.dto.response.RedacoesPorDiaResponse;
import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import redAi.backend.redAi.model.entity.Role;
import redAi.backend.redAi.model.entity.StatusRedacao;
import redAi.backend.redAi.repository.ConfiguracaoProvaRepository;
import redAi.backend.redAi.repository.RedacaoRepository;
import redAi.backend.redAi.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DIA_MES_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    private final RedacaoRepository redacaoRepository;
    private final UserRepository userRepository;
    private final ConfiguracaoProvaRepository provaRepository;

    public DashboardService(
            RedacaoRepository redacaoRepository,
            UserRepository userRepository,
            ConfiguracaoProvaRepository provaRepository
    ) {
        this.redacaoRepository = redacaoRepository;
        this.userRepository = userRepository;
        this.provaRepository = provaRepository;
    }

    @Cacheable("dashboardResumo")
    @Transactional(readOnly = true)
    public DashboardResumoResponse resumo() {
        return new DashboardResumoResponse(
                redacaoRepository.countByStatus(StatusRedacao.CONCLUIDA),
                userRepository.countByRole(Role.CANDIDATO),
                provaRepository.countByAtivoTrue()
        );
    }

    @Cacheable("dashboardRedacoesPorDia")
    @Transactional(readOnly = true)
    public List<RedacoesPorDiaResponse> redacoesPorDia() {
        LocalDate hoje = LocalDate.now(ZONE_ID);
        LocalDate primeiroDia = hoje.minusDays(6);
        OffsetDateTime inicio = primeiroDia.atStartOfDay(ZONE_ID).toOffsetDateTime();
        Map<LocalDate, Long> totaisPorDia = redacaoRepository.findByCreatedAtGreaterThanEqual(inicio).stream()
                .collect(Collectors.groupingBy(
                        redacao -> redacao.getCreatedAt().atZoneSameInstant(ZONE_ID).toLocalDate(),
                        Collectors.counting()
                ));

        return primeiroDia.datesUntil(hoje.plusDays(1))
                .map(data -> new RedacoesPorDiaResponse(
                        data.format(DIA_MES_FORMATTER),
                        totaisPorDia.getOrDefault(data, 0L)
                ))
                .toList();
    }

    @Cacheable("dashboardRankingProvas")
    @Transactional(readOnly = true)
    public List<RankingProvaResponse> rankingProvas() {
        Map<ConfiguracaoProva, Long> totaisPorProva = redacaoRepository.findAllBy().stream()
                .map(Redacao::getProva)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        return totaisPorProva.entrySet().stream()
                .sorted(Map.Entry.<ConfiguracaoProva, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new RankingProvaResponse(
                        entry.getKey().getCargo(),
                        entry.getKey().getBanca(),
                        entry.getValue()
                ))
                .toList();
    }

    @Cacheable("dashboardAtividadeRecente")
    @Transactional(readOnly = true)
    public List<AtividadeRecenteResponse> atividadeRecente() {
        return redacaoRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::toAtividadeResponse)
                .toList();
    }

    @Scheduled(fixedRate = 60000)
    @CacheEvict(
            cacheNames = {
                    "dashboardResumo",
                    "dashboardRedacoesPorDia",
                    "dashboardRankingProvas",
                    "dashboardAtividadeRecente"
            },
            allEntries = true
    )
    public void limparCacheDashboard() {
        // TTL simples para manter @Cacheable sem acoplar o projeto a um provider externo.
    }

    private AtividadeRecenteResponse toAtividadeResponse(Redacao redacao) {
        ResultadoCorrecao resultado = redacao.getResultado();
        return new AtividadeRecenteResponse(
                redacao.getCandidato().getNome(),
                redacao.getProva().getCargo(),
                redacao.getProva().getBanca(),
                redacao.getStatus(),
                resultado == null ? null : resultado.getNotaTotal(),
                resultado == null ? null : resultado.getPercentualAproveitamento(),
                redacao.getCreatedAt()
        );
    }
}
