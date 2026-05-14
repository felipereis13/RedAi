ALTER TABLE redacoes
    ADD COLUMN titulo VARCHAR(180),
    ADD COLUMN tema VARCHAR(220);

UPDATE redacoes
SET titulo = CONCAT('Redacao #', id),
    tema = 'Tema nao informado'
WHERE titulo IS NULL OR tema IS NULL;

ALTER TABLE redacoes
    ALTER COLUMN titulo SET NOT NULL,
    ALTER COLUMN tema SET NOT NULL;
