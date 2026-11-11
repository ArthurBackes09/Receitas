CREATE DATABASE IF NOT EXISTS organizar_receitas
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE organizar_receitas;

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS subcategorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE (categoria_id, nome)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel ENUM('comum', 'administrador') NOT NULL DEFAULT 'comum'
);

CREATE TABLE IF NOT EXISTS receitas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    subcategoria_id INT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    ingredientes TEXT NOT NULL,
    modo_preparo TEXT NOT NULL,
    foto VARCHAR(255),
    privacidade ENUM('publica', 'privada') NOT NULL DEFAULT 'privada',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS videos_salvos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    categoria_id INT NOT NULL,
    subcategoria_id INT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT,
    url_video VARCHAR(500) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

INSERT INTO categorias (nome) VALUES
    ('Doces'), ('Salgados'), ('Bebidas'), ('Massas'), ('Outros')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO subcategorias (categoria_id, nome)
SELECT c.id, s.nome
FROM categorias c
JOIN (
    SELECT 'Doces' categoria, 'Bolos' nome
    UNION ALL SELECT 'Doces', 'Tortas'
    UNION ALL SELECT 'Doces', 'Sobremesas'
    UNION ALL SELECT 'Doces', 'Chocolates'
    UNION ALL SELECT 'Doces', 'Biscoitos'
    UNION ALL SELECT 'Salgados', 'Pratos principais'
    UNION ALL SELECT 'Salgados', 'Aperitivos'
    UNION ALL SELECT 'Salgados', 'Acompanhamentos'
    UNION ALL SELECT 'Salgados', 'Petiscos'
    UNION ALL SELECT 'Salgados', 'Saladas'
    UNION ALL SELECT 'Bebidas', 'Sucos'
    UNION ALL SELECT 'Bebidas', 'Vitaminas'
    UNION ALL SELECT 'Bebidas', 'Bebidas quentes'
    UNION ALL SELECT 'Bebidas', 'Drinks'
    UNION ALL SELECT 'Massas', 'Macarrão'
    UNION ALL SELECT 'Massas', 'Pizzas'
    UNION ALL SELECT 'Massas', 'Pães'
    UNION ALL SELECT 'Massas', 'Panquecas'
) s ON s.categoria = c.nome
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
