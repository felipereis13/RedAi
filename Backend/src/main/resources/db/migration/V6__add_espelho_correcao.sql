CREATE TABLE espelhos_correcao (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    conteudo_texto TEXT,
    nome_arquivo VARCHAR(255),
    caminho_arquivo VARCHAR(500),
    tipo VARCHAR(30) NOT NULL,
    ordem INTEGER NOT NULL,
    configuracao_prova_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_espelhos_configuracao_prova
        FOREIGN KEY (configuracao_prova_id)
        REFERENCES configuracoes_prova (id)
        ON DELETE CASCADE,
    CONSTRAINT ck_espelhos_tipo CHECK (tipo IN ('ESPELHO', 'REDACAO_MODELO')),
    CONSTRAINT ck_espelhos_ordem CHECK (ordem BETWEEN 1 AND 2),
    CONSTRAINT ck_espelhos_conteudo CHECK (
        conteudo_texto IS NOT NULL OR caminho_arquivo IS NOT NULL
    ),
    CONSTRAINT uk_espelhos_tipo_ordem_por_prova UNIQUE (configuracao_prova_id, tipo, ordem)
);
