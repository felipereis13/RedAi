package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.Redacao;
import redAi.backend.redAi.model.entity.StatusRedacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    List<Redacao> findByProvaIdOrderByCreatedAtDesc(Long idProva);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findTop5ByCandidatoEmailOrderByCreatedAtDesc(String candidatoEmail);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findByCandidatoEmailAndStatusOrderByCreatedAtAsc(String candidatoEmail, StatusRedacao status);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    @Query("""
            select r
            from Redacao r
            where r.candidato.email = :candidatoEmail
              and (:idProva is null or r.prova.id = :idProva)
              and (:status is null or r.status = :status)
            """)
    Page<Redacao> buscarHistorico(
            @Param("candidatoEmail") String candidatoEmail,
            @Param("idProva") Long idProva,
            @Param("status") StatusRedacao status,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"prova", "resultado"})
    @Query("""
            select r
            from Redacao r
            where r.candidato.email = :candidatoEmail
              and r.status = :status
              and (:idProva is null or r.prova.id = :idProva)
            order by r.createdAt asc
            """)
    List<Redacao> buscarEvolucao(
            @Param("candidatoEmail") String candidatoEmail,
            @Param("status") StatusRedacao status,
            @Param("idProva") Long idProva,
            Pageable pageable
    );

    long countByStatus(StatusRedacao status);

    boolean existsByProvaId(Long idProva);

    @EntityGraph(attributePaths = {"prova"})
    List<Redacao> findByCreatedAtGreaterThanEqual(OffsetDateTime createdAt);

    @EntityGraph(attributePaths = {"candidato", "prova", "resultado"})
    List<Redacao> findTop10ByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"prova"})
    List<Redacao> findAllBy();
}
