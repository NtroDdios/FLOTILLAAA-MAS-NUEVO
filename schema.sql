CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS unidades (
    id VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(255) NOT NULL,
    responsable VARCHAR(255),
    km_actual INT DEFAULT 0,
    recorridos INT DEFAULT 0,
    intervalo INT DEFAULT 5000,
    operador VARCHAR(255),
    eco VARCHAR(50),
    alerta VARCHAR(50) DEFAULT 'SIN_KM'
);

CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_unidad VARCHAR(50),
    tipo VARCHAR(100),
    km INT,
    tecnico VARCHAR(255),
    costo DECIMAL(10,2),
    notas TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_unidad) REFERENCES unidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consumibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_servicio INT,
    producto VARCHAR(255) NOT NULL,
    cantidad INT DEFAULT 1,
    costo_unitario DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (id_servicio) REFERENCES servicios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS afinaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_unidad VARCHAR(50),
    km INT,
    fecha VARCHAR(50),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_unidad) REFERENCES unidades(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texto TEXT,
    fotoUrl TEXT,
    audioUrl TEXT,
    docUrl TEXT,
    docName VARCHAR(255),
    usuario VARCHAR(100),
    nombre VARCHAR(255),
    rol VARCHAR(100),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed defaults if empty
INSERT IGNORE INTO configuracion (clave, valor) VALUES ('intervalo_mantenimiento', '5000');

INSERT IGNORE INTO unidades (id, descripcion, responsable, km_actual, recorridos, intervalo, operador, eco, alerta) VALUES
('U-01', 'Toyota Hilux Blanca 2022', 'Juan Contreras', 124500, 1200, 5000, 'Juan Contreras', '01', 'AL_DIA'),
('U-02', 'Nissan Frontier 2021', 'Alfredo Netro', 98000, 4800, 5000, 'Alfredo Netro', '02', 'PROXIMO'),
('U-03', 'Toyota Hilux Gris 2023', 'Williams Ramos', 45000, 5200, 5000, 'Williams Ramos', '03', 'URGENTE');
