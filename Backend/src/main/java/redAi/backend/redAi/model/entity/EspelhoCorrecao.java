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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "espelhos_correcao")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EspelhoCorrecao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String titulo;

    @Column(columnDefinition = "text")
    private String conteudoTexto;

    @Column(length = 255)
    private String nomeArquivo;

    @Column(length = 500)
    private String caminhoArquivo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoEspelhoCorrecao tipo;

    @Column(nullable = false)
    private int ordem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "configuracao_prova_id", nullable = false)
    private ConfiguracaoProva configuracaoProva;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
