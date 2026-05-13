package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.ConfiguracaoProva;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConfiguracaoProvaRepository extends JpaRepository<ConfiguracaoProva, Long> {

    @EntityGraph(attributePaths = "criterios")
    List<ConfiguracaoProva> findByAtivoTrueOrderByIdDesc();

    @EntityGraph(attributePaths = "criterios")
    List<ConfiguracaoProva> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = "criterios")
    Optional<ConfiguracaoProva> findWithCriteriosById(Long id);
}
