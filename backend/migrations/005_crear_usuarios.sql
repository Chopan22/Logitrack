CREATE TABLE IF NOT EXISTS usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  UNIQUE NOT NULL,
    password    VARCHAR(255)  NOT NULL,
    rol         VARCHAR(20)   NOT NULL DEFAULT 'admin',
    creado_en   TIMESTAMP     DEFAULT NOW()
);
