package redAi.backend.redAi.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "redacoes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Redacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5000)
    private String texto;

    @Column(nullable = false, length = 180)
    private String titulo;

    @Column(nullable = false, length = 220)
    private String tema;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusRedacao status = StatusRedacao.PENDENTE;

    @Builder.Default
    @Column(nullable = false)
    private int tentativas = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private User candidato;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "prova_id", nullable = false)
    private ConfiguracaoProva prova;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @OneToOne(mappedBy = "redacao", fetch = FetchType.LAZY)
    private ResultadoCorrecao resultado;
}
