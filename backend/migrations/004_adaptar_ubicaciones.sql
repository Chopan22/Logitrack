DROP TABLE IF EXISTS ubicaciones;

CREATE TABLE ubicaciones (
    id          SERIAL PRIMARY KEY,
    ruta_id     INTEGER      NOT NULL REFERENCES rutas(id),
    coordenadas GEOMETRY(Point, 4326),
    fecha_hora  TIMESTAMP    DEFAULT NOW()
);
