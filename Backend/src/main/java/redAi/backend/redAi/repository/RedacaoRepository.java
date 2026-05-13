package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.Redacao;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RedacaoRepository extends JpaRepository<Redacao, Long> {

    @EntityGraph(attributePaths = {"prova", "resultado"})
    Optional<Redacao> findByIdAndCandidatoEmail(Long id, String candidatoEmail);

    @EntityGraph(attributePaths = {"prova", "resultado"})
    List<Redacao> findByCandidatoEmailOrderByIdDesc(String candidatoEmail);
}
