ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS radio_geocerca INT DEFAULT 100;

CREATE TABLE IF NOT EXISTS eventos_geocerca (
    id            SERIAL PRIMARY KEY,
    pedido_id     INTEGER REFERENCES pedidos(id) NOT NULL,
    ruta_id       INTEGER REFERENCES rutas(id),
    conductor_id  INTEGER REFERENCES conductores(id),
    lat           DECIMAL(10,8),
    lng           DECIMAL(11,8),
    ocurrido_en   TIMESTAMP DEFAULT NOW(),
    creado_en     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_eventos_geocerca_pedido ON eventos_geocerca(pedido_id);
