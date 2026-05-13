CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'CANDIDATO'))
);

CREATE TABLE configuracoes_prova (
    id BIGSERIAL PRIMARY KEY,
    cargo VARCHAR(120) NOT NULL,
    banca VARCHAR(80) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    descricao TEXT,
    nota_maxima DOUBLE PRECISION NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_configuracoes_prova_nota_maxima CHECK (nota_maxima > 0)
);

CREATE TABLE criterios_correcao (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    nota_maxima DOUBLE PRECISION NOT NULL,
    configuracao_prova_id BIGINT NOT NULL,
    CONSTRAINT fk_criterios_configuracao_prova
        FOREIGN KEY (configuracao_prova_id)
        REFERENCES configuracoes_prova (id)
        ON DELETE CASCADE,
    CONSTRAINT ck_criterios_correcao_nota_maxima CHECK (nota_maxima >= 0.1)
);

CREATE TABLE redacoes (
    id BIGSERIAL PRIMARY KEY,
    texto VARCHAR(5000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    candidato_id BIGINT NOT NULL,
    prova_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_redacoes_candidato
        FOREIGN KEY (candidato_id)
        REFERENCES users (id),
    CONSTRAINT fk_redacoes_prova
        FOREIGN KEY (prova_id)
        REFERENCES configuracoes_prova (id),
    CONSTRAINT ck_redacoes_status CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDA', 'ERRO')),
    CONSTRAINT ck_redacoes_texto_tamanho CHECK (char_length(texto) <= 5000)
);

CREATE TABLE resultados_correcao (
    id BIGSERIAL PRIMARY KEY,
    nota_total DOUBLE PRECISION NOT NULL,
    nota_maxima_prova DOUBLE PRECISION NOT NULL,
    percentual_aproveitamento DOUBLE PRECISION NOT NULL,
    feedback_geral TEXT NOT NULL,
    avaliacoes_criterios JSONB NOT NULL,
    redacao_id BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_resultados_redacao
        FOREIGN KEY (redacao_id)
        REFERENCES redacoes (id)
        ON DELETE CASCADE,
    CONSTRAINT ck_resultados_nota_total CHECK (nota_total >= 0),
    CONSTRAINT ck_resultados_nota_maxima_prova CHECK (nota_maxima_prova > 0),
    CONSTRAINT ck_resultados_percentual CHECK (percentual_aproveitamento >= 0)
);
