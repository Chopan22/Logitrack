CREATE TABLE IF NOT EXISTS conductores (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL,
    telefono    VARCHAR(20),
    activo      BOOLEAN      DEFAULT true,
    creado_en   TIMESTAMP    DEFAULT NOW()
);
