ALTER TABLE configuracoes_prova
    ADD COLUMN quantidade_linhas INTEGER NOT NULL DEFAULT 30;

ALTER TABLE configuracoes_prova
    ADD CONSTRAINT ck_configuracoes_prova_quantidade_linhas
        CHECK (quantidade_linhas BETWEEN 10 AND 60);
