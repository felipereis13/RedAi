package redAi.backend.redAi.repository;

import redAi.backend.redAi.model.entity.EspelhoCorrecao;
import redAi.backend.redAi.model.entity.TipoEspelhoCorrecao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EspelhoCorrecaoRepository extends JpaRepository<EspelhoCorrecao, Long> {

    List<EspelhoCorrecao> findByConfiguracaoProvaIdOrderByTipoAscOrdemAsc(Long configuracaoProvaId);

    List<EspelhoCorrecao> findByConfiguracaoProvaIdAndTipoOrderByOrdemAsc(Long configuracaoProvaId, TipoEspelhoCorrecao tipo);

    Optional<EspelhoCorrecao> findByIdAndConfiguracaoProvaId(Long id, Long configuracaoProvaId);

    long countByConfiguracaoProvaIdAndTipo(Long configuracaoProvaId, TipoEspelhoCorrecao tipo);
}
