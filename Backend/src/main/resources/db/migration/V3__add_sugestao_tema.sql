CREATE TABLE sugestoes_tema (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(160) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    configuracao_prova_id BIGINT NOT NULL,
    CONSTRAINT fk_sugestoes_tema_configuracao_prova
        FOREIGN KEY (configuracao_prova_id)
        REFERENCES configuracoes_prova (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_sugestoes_tema_configuracao_prova
    ON sugestoes_tema (configuracao_prova_id);

CREATE INDEX idx_sugestoes_tema_configuracao_prova_ativo
    ON sugestoes_tema (configuracao_prova_id, ativo);
