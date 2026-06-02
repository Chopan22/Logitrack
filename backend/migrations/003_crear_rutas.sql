CREATE TABLE IF NOT EXISTS rutas (
    id              SERIAL PRIMARY KEY,
    vehiculo_id     INTEGER      NOT NULL REFERENCES vehiculos(id),
    conductor_id    INTEGER      NOT NULL REFERENCES conductores(id),
    estado          VARCHAR(20)  NOT NULL DEFAULT 'en_curso',
    inicio          TIMESTAMP    DEFAULT NOW(),
    fin             TIMESTAMP
);
