# Organizador de Receitas

## Sobre o projeto
O Organizador de Receitas é uma rede social voltada para pessoas que gostam de cozinhar e compartilhar receitas. A plataforma permite que os usuários cadastrem suas próprias receitas, salvem links de vídeos de culinária e compartilhem suas publicações com outras pessoas.

Os usuários poderão escolher se suas receitas serão públicas ou privadas. Receitas públicas aparecerão no feed, onde outros usuários poderão visualizar, curtir, comentar e salvar como favoritas. Receitas privadas ficarão visíveis somente para o proprietário.

## Problema
Muitas pessoas encontram receitas em vídeos nas redes sociais e depois têm dificuldade para encontrá-los novamente. Além disso, suas receitas próprias ficam espalhadas em cadernos, anotações e outros aplicativos.

## Público-alvo
Pessoas que gostam de cozinhar, aprender novas receitas, organizar suas preparações e compartilhar ideias culinárias.

## Solução proposta
Criar uma plataforma para cadastrar e organizar receitas, salvar vídeos culinários, compartilhar publicações e interagir por meio de curtidas, comentários e favoritos.

## Funcionalidades

### Usuários
- Cadastro e login.
- Perfis de usuário comum e administrador.
- Visualização de perfis de outros usuários.
- Controle de permissões.

### Receitas
- Cadastro com nome, descrição, ingredientes e modo de preparo.
- Foto opcional. Receitas sem foto não terão imagem automática.
- Categoria principal obrigatória e subcategoria opcional.
- Privacidade pública ou privada, com alteração posterior.
- Edição e exclusão somente pelo proprietário.
- Consulta das receitas cadastradas pelo usuário.

### Feed e interações
- Exibição das receitas públicas de todos os usuários.
- Curtidas, comentários e favoritos.
- Compartilhamento por link.
- Receitas privadas não serão exibidas a outros usuários.

### Vídeos salvos
- Salvamento de links de vídeos encontrados em outras plataformas.
- Título e descrição.
- Categoria principal e subcategoria opcionais.
- Privacidade pública ou privada, edição e exclusão pelo proprietário.

## Categorias e subcategorias
As mesmas categorias serão usadas em receitas e vídeos:

- **Doces:** bolos, tortas, sobremesas, chocolates e biscoitos.
- **Salgados:** pratos principais, aperitivos, acompanhamentos, petiscos e saladas.
- **Bebidas:** sucos, vitaminas, bebidas quentes e drinks.
- **Massas:** macarrão, pizzas, pães e panquecas.
- **Outros:** outras preparações.

## Tipos de usuários e permissões

### Usuário comum
Pode criar conta, gerenciar suas próprias receitas e vídeos, alterar a privacidade das publicações, visualizar perfis públicos e usar curtidas, comentários e favoritos.

### Administrador
Pode gerenciar usuários, categorias, subcategorias e conteúdos da plataforma, conforme o sistema de permissões.

## Fluxo básico
1. O usuário cria uma conta ou faz login.
2. Acessa o feed de receitas públicas.
3. Visualiza, curta, comenta, compartilha ou favorita publicações.
4. Cadastra uma receita própria e informa categoria, privacidade, ingredientes e modo de preparo.
5. Salva vídeos culinários em sua área pessoal.
6. O usuário acessa seus próprios conteúdos, favoritos e perfil.

## Estrutura do projeto
```text
Organizar_Receitas/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   ├── database/
│   └── config/
├── frontend/
│   ├── index.html
│   ├── css/
│   └── js/
├── sql/
├── README.md
└── .gitignore
```

## Tecnologias
- HTML para a estrutura das páginas.
- CSS para a interface responsiva.
- JavaScript para interações no frontend.
- Node.js e Express para o backend.
- MySQL para o banco de dados.
- Fetch API para comunicação com a API.
- JWT para autenticação nas entregas seguintes.

## Banco de dados
Execute o arquivo `sql/banco.sql` em uma conexão MySQL. Ele cria o banco `organizar_receitas`, as tabelas relacionadas, as categorias e as subcategorias iniciais.

## Como testar

### Pré-requisitos
Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/) — necessário para executar o backend.
- MySQL — necessário para criar e acessar o banco de dados.
- Express — biblioteca do Node.js utilizada para criar o servidor e suas rotas.
- mysql2 — biblioteca utilizada pelo Node.js para se conectar ao MySQL.

Dentro da pasta `Organizar_Receitas/backend`, instale o Express e o mysql2 com os comandos:

```bash
npm install express
npm install mysql2
```

### Testando o frontend
1. Entre na pasta `Organizar_Receitas/frontend`.
2. Abra `index.html` diretamente no navegador ou utilize o Live Server do VS Code.
3. Verifique o feed, as áreas principais, os filtros e os formulários de protótipo.

## Arquivos iniciais
- `frontend/index.html`: estrutura das áreas da rede social.
- `frontend/css/style.css`: aparência visual e responsividade.
- `frontend/js/script.js`: comportamento simples de navegação e filtro.
- `backend/*`: pastas reservadas para API, regras de negócio, segurança e banco nas próximas entregas.
- `sql/`: scripts de criação das tabelas e categorias iniciais.

## Entrega 2 - Banco de dados e autenticação

Esta etapa implementa o banco MySQL relacionado, cadastro, login, proteção de senhas com bcryptjs, autenticação JWT e controle inicial de acesso por perfil.

### Banco de dados
- Banco: `organizar_receitas`.
- Tabelas principais: `usuarios`, `categorias`, `subcategorias` e `receitas`.
- O email dos usuários é único.
- Perfis disponíveis: `comum` e `administrador`.
- A receita pertence a um usuário e possui categoria obrigatória e subcategoria opcional.

### Instalação
Na pasta `Organizar_Receitas`, execute:

```bash
npm install
copy .env.example .env
```

Preencha o arquivo `.env`. Use uma chave longa e aleatória em `JWT_SECRET`. Nunca envie o arquivo `.env` ao repositório.

### Configuração do MySQL
1. Abra o MySQL Workbench ou o terminal do MySQL.
2. Execute o arquivo `sql/banco.sql`.
3. Confirme que o banco `organizar_receitas`, suas tabelas e categorias foram criados.

### Executando
Na pasta `Organizar_Receitas`, execute:

```bash
npm start
```

Acesse `http://localhost:3000`. Para testar a conexão com o banco: `http://localhost:3000/api/health`.

### API de autenticação

**Cadastro:**

```text
POST /api/usuarios/cadastrar
Content-Type: application/json

{"nome":"Maria","email":"maria@email.com","senha":"123456"}
```

O perfil é sempre criado como `comum`, mesmo que outro perfil seja enviado no formulário ou JSON.

**Login:**

```text
POST /api/usuarios/login
Content-Type: application/json

{"email":"maria@email.com","senha":"123456"}
```

A resposta contém o usuário e o token JWT. Utilize o valor de `token` no cabeçalho das rotas protegidas:

```text
Authorization: Bearer COLE_O_TOKEN_AQUI
```

**Rotas protegidas:**

- `GET /api/usuarios/eu`: dados do usuário autenticado.
- `GET /api/usuarios/admin`: disponível apenas para usuários com perfil `administrador`.

### Criando um administrador de forma segura
Não escolha o perfil administrador no cadastro público. Para criar o primeiro administrador, cadastre normalmente o usuário pelo sistema e, depois, altere apenas esse registro diretamente no MySQL com o comando:

```sql
USE organizar_receitas;
UPDATE usuarios SET nivel = 'administrador'
WHERE email = 'email_do_administrador@email.com';
```

Faça o login novamente para obter um novo token com o perfil atualizado.

### Testes com Thunder Client
1. Execute o arquivo SQL e inicie o servidor.
2. Envie o cadastro por `POST` para `/api/usuarios/cadastrar`.
3. Envie o login por `POST` para `/api/usuarios/login` e copie o token.
4. Acesse `/api/usuarios/eu` sem token: esperado status `401`.
5. Repita com `Authorization: Bearer <token>`: esperado status `200`.
6. Acesse `/api/usuarios/admin` com usuário comum: esperado status `403`.
7. Faça login com o administrador criado e repita a rota: esperado status `200`.
8. Teste um JWT inválido ou expirado para confirmar o erro `401`.

## Segurança implementada
- Senhas armazenadas com hash bcryptjs.
- Email único no banco.
- Hash e senha nunca são devolvidos pela API.
- Secret do JWT configurado exclusivamente por variável de ambiente.
- Autenticação pelo formato Bearer.
- Autorização administrativa verificada no backend.
- `.env` excluído pelo `.gitignore`.
