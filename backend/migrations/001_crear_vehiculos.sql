CREATE TABLE IF NOT EXISTS vehiculos (
    id          SERIAL PRIMARY KEY,
    patente     VARCHAR(20)  UNIQUE NOT NULL,
    alias       VARCHAR(50),
    tipo        VARCHAR(30),
    activo      BOOLEAN      DEFAULT true,
    creado_en   TIMESTAMP    DEFAULT NOW()
);
