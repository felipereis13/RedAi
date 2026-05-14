package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.StatusRedacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface RedacaoRepository extends JpaRepository<Redacao, Long> {

    @EntityGraph(attributePaths = {"candidato", "prova", "resultado"})
    Optional<Redacao> findWithCandidatoAndResultadoById(Long id);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    Optional<Redacao> findByIdAndCandidatoEmail(Long id, String candidatoEmail);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findByCandidatoEmailOrderByIdDesc(String candidatoEmail);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findTop5ByCandidatoEmailOrderByCreatedAtDesc(String candidatoEmail);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findByCandidatoEmailAndStatusOrderByCreatedAtAsc(String candidatoEmail, StatusRedacao status);

    long countByStatus(StatusRedacao status);

    @EntityGraph(attributePaths = {"prova"})
    List<Redacao> findByCreatedAtGreaterThanEqual(OffsetDateTime createdAt);

    @EntityGraph(attributePaths = {"candidato", "prova", "resultado"})
    List<Redacao> findTop10ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"prova"})
    List<Redacao> findAllBy();
}
