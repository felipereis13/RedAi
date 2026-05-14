ALTER TABLE redacoes
    ADD COLUMN tentativas INTEGER NOT NULL DEFAULT 0;

ALTER TABLE redacoes
    ADD CONSTRAINT ck_redacoes_tentativas CHECK (tentativas >= 0);
