package redAi.backend.redAi.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "resultados_correcao")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResultadoCorrecao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private double notaTotal;

    @Column(nullable = false)
    private double notaMaximaProva;

    @Column(nullable = false)
    private double percentualAproveitamento;

    @Column(nullable = false, columnDefinition = "text")
    private String feedbackGeral;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String avaliacoesCriterios;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "redacao_id", nullable = false, unique = true)
    private Redacao redacao;
}
