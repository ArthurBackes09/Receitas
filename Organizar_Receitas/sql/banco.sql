CREATE DATABASE IF NOT EXISTS organizar_receitas;
USE organizar_receitas;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'comum'
);

CREATE TABLE receitas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  ingredientes TEXT NOT NULL,
  modo_preparo TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(50),
  foto VARCHAR(255),
  privacidade VARCHAR(20) NOT NULL DEFAULT 'privada',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  link VARCHAR(500) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  subcategoria VARCHAR(50),
  privacidade VARCHAR(20) NOT NULL DEFAULT 'privada',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE favoritos (
  usuario_id INT NOT NULL,
  receita_id INT NOT NULL,
  PRIMARY KEY (usuario_id, receita_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (receita_id) REFERENCES receitas(id)
);
