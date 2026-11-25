DROP DATABASE IF EXISTS grafo-rotas;
CREATE DATABASE grafo-rotas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE grafo-rotas;

CREATE TABLE vertices (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nome   VARCHAR(100) NOT NULL,
    pos_x  INT NOT NULL,           
    pos_y  INT NOT NULL           
);

CREATE TABLE arestas (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    origem_id   INT NOT NULL,
    destino_id  INT NOT NULL,
    peso        INT NOT NULL DEFAULT 1,
    bloqueada   BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (origem_id)  REFERENCES vertices(id) ON DELETE CASCADE,
    FOREIGN KEY (destino_id) REFERENCES vertices(id) ON DELETE CASCADE
);

INSERT INTO vertices (nome, pos_x, pos_y) VALUES
('A - Centro',    120, 300),
('B - Praça',     300, 120),
('C - Mercado',   300, 480),
('D - Escola',    480, 300),
('E - Parque',    620, 100),
('F - Estádio',   620, 500),
('G - Hospital',  780, 300),
('H - Rodoviária',900, 180);

INSERT INTO arestas (origem_id, destino_id, peso) VALUES
(1, 2, 10), (1, 3, 12), (2, 4, 8),  (3, 4, 7),
(4, 5, 9),  (4, 6, 11), (5, 7, 6),  (6, 7, 5),
(2, 5, 14), (3, 6, 13), (7, 8, 8);
