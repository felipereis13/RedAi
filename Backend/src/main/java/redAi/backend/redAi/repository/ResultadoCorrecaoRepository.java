package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.ResultadoCorrecao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResultadoCorrecaoRepository extends JpaRepository<ResultadoCorrecao, Long> {

    void deleteByRedacaoId(Long redacaoId);
}
