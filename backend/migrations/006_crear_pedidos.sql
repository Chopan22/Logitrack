CREATE TABLE IF NOT EXISTS pedidos (
    id                  SERIAL PRIMARY KEY,
    descripcion         VARCHAR(255),
    direccion_destino   VARCHAR(255)  NOT NULL,
    coordenadas_destino GEOMETRY(Point, 4326),
    cliente_nombre      VARCHAR(100),
    cliente_telefono    VARCHAR(20),
    estado              VARCHAR(20)   NOT NULL DEFAULT 'pendiente',
    ruta_id             INTEGER       REFERENCES rutas(id),
    creado_en           TIMESTAMP     DEFAULT NOW()
);
