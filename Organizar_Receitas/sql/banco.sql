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

CREATE TABLE IF NOT EXISTS configuracoes_site (
    chave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT INTO configuracoes_site (chave, valor) VALUES
    ('nome_site', 'Organizador de Receitas'),
    ('texto_rodape', 'Um caderno digital para guardar e compartilhar bons sabores.'),
    ('nav_categorias', 'Categorias'),
    ('nav_explorar', 'Explorar receitas'),
    ('nav_inicio', 'Início'),
    ('nav_entrar', 'Entrar'),
    ('nav_minhas', 'Minhas receitas'),
    ('nav_admin', 'Administração'),
    ('nav_nova', '＋ Nova receita'),
    ('nav_sair', 'Sair'),
    ('login_botao', 'Entrar'),
    ('titulo', 'Todas as suas receitas favoritas em um só lugar.'),
    ('subtitulo', 'Seu caderno, seus sabores'),
    ('descricao', 'Organize suas receitas em um só lugar e encontre novas ideias para cozinhar.'),
    ('foto_destaque', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'),
    ('inicio_explorar', 'Explorar receitas'),
    ('inicio_acessar', 'Acessar minha conta'),
    ('categorias_subtitulo', 'Organize por sabor'),
    ('categorias_titulo', 'Explore as categorias'),
    ('receitas_subtitulo', 'Inspire-se para a próxima refeição'),
    ('receitas_titulo', 'Receitas da comunidade'),
    ('login_subtitulo', 'Tenha seu espaço'),
    ('login_titulo', 'Entre no seu caderno'),
    ('login_descricao', 'Faça login para organizar suas receitas e acompanhar suas criações.'),
    ('login_cadastro', 'Ainda não tem uma conta? Cadastre-se'),
    ('foto_cadastro', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85'),
    ('cadastro_subtitulo', 'Comece agora'),
    ('cadastro_titulo', 'Crie seu caderno de receitas.'),
    ('cadastro_descricao', 'Cadastre suas receitas e mantenha tudo organizado em um só lugar.'),
    ('cadastro_form_titulo', 'Criar sua conta'),
    ('cadastro_botao', 'Cadastrar'),
    ('cadastro_login_prompt', 'Já possui uma conta?'),
    ('cadastro_login_link', 'Voltar para o login'),
    ('minhas_subtitulo', 'Seu livro de cozinha'),
    ('minhas_titulo', 'Minhas receitas'),
    ('minhas_descricao', 'Gerencie suas receitas particulares e públicas.'),
    ('minhas_botao', '＋ Cadastrar receita'),
    ('minhas_ver', 'Ver minhas receitas'),
    ('form_subtitulo', 'Seu caderno digital'),
    ('form_titulo', 'Uma receita para guardar'),
    ('form_descricao', 'Preencha os detalhes para deixar seu preparo organizado.'),
    ('form_sobre', 'Sobre a receita'),
    ('form_preparo', 'Ingredientes e preparo'),
    ('form_imagem', 'Imagem e visibilidade'),
    ('form_cancelar', 'Cancelar'),
    ('form_salvar', 'Salvar receita'),
    ('detalhe_voltar', '← Voltar às receitas'),
    ('detalhe_ingredientes', 'Ingredientes'),
    ('detalhe_preparo', 'Modo de preparo'),
    ('detalhe_editar', 'Editar receita'),
    ('detalhe_excluir', 'Excluir receita'),
    ('admin_subtitulo', 'Gerenciamento do site'),
    ('admin_titulo', 'Painel administrativo'),
    ('admin_descricao', 'Gerencie receitas, perfis, categorias e o conteúdo da página inicial.'),
    ('admin_receitas', 'Receitas'),
    ('admin_receitas_descricao', 'Administradores podem editar ou excluir receitas de qualquer conta.'),
    ('admin_usuarios', 'Usuários'),
    ('admin_usuarios_descricao', 'Altere o nível de acesso. As contas não podem ser excluídas por este painel.'),
    ('admin_categorias', 'Categorias e subcategorias'),
    ('admin_conteudo', 'Conteúdo de todas as páginas'),
    ('admin_conteudo_descricao', 'Edite os textos e as imagens usados nas páginas do site. A estrutura e as funcionalidades serão mantidas.')
ON DUPLICATE KEY UPDATE chave = VALUES(chave);

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
