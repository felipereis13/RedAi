package redAi.backend.redAi.model.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "configuracoes_prova")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracaoProva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String cargo;

    @Column(nullable = false, length = 80)
    private String banca;

    @Column(nullable = false, length = 2)
    private String estado;

    @Column(columnDefinition = "text")
    private String descricao;

    @Positive
    @Column(nullable = false)
    private double notaMaxima;

    @Builder.Default
    @Column(nullable = false)
    private boolean ativo = true;

    @Builder.Default
    @OneToMany(mappedBy = "configuracaoProva", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CriterioCorrecao> criterios = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "prova")
    private List<Redacao> redacoes = new ArrayList<>();
}
