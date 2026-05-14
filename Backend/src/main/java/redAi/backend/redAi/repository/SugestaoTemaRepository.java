package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.SugestaoTema;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SugestaoTemaRepository extends JpaRepository<SugestaoTema, Long> {

    List<SugestaoTema> findByConfiguracaoProvaIdOrderByIdDesc(Long idProva);

    List<SugestaoTema> findByConfiguracaoProvaIdAndAtivoTrueOrderByIdDesc(Long idProva);

    Optional<SugestaoTema> findByIdAndConfiguracaoProvaId(Long id, Long idProva);
}
