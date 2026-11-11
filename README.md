# Organizador de Receitas

## Sobre o projeto
O Organizador de Receitas ajuda pessoas a guardar receitas próprias, organizar os ingredientes e modo de preparo e encontrar novamente vídeos culinários encontrados em redes sociais.

## Problema
Receitas encontradas em vídeos podem ser difíceis de localizar posteriormente. Além disso, receitas próprias ficam espalhadas entre cadernos, aplicativos e anotações.

## Solução proposta
Criar uma plataforma organizada para cadastro de usuários, receitas e vídeos culinários, com acesso individual e controle de diferentes tipos de usuários.

## Funcionalidades atuais

### Frontend
- Página responsiva de login.
- Página responsiva de cadastro.
- Confirmação da senha no cadastro.
- Validação básica de nome, email e senha.
- Mensagens de sucesso e erro para o usuário.
- Consulta dos dados do usuário autenticado.
- Painel administrativo exibido somente para usuário administrador.
- Teste visual da área administrativa.

### Backend
- Cadastro de usuários.
- Login com email e senha.
- Senhas protegidas com bcryptjs.
- Autenticação com JWT.
- Rota protegida para consultar os dados do usuário.
- Rota protegida exclusiva para administradores.
- Validação de email, nome, senha mínima e campos obrigatórios.
- Controle dos perfis `comum` e `administrador`.

### Banco de dados
- Banco MySQL `organizar_receitas`.
- Tabelas de usuários, categorias, subcategorias, receitas e vídeos salvos.
- Vídeos salvos possuem autoria, título, descrição, URL e classificação por categoria e subcategoria.
- Relacionamentos por chaves estrangeiras.
- Categorias e subcategorias iniciais.
- Email de usuário único.

## Funcionalidades planejadas para entregas futuras
- Cadastro, edição e exclusão de receitas completas.
- Adição de foto às receitas.
- Cadastro, edição, consulta e exclusão de vídeos salvos pela aplicação. A tabela relacional já está criada.
- Área separada para receitas e vídeos.
- Feed de receitas públicas.
- Curtidas, comentários, favoritos e compartilhamento.
- Perfis públicos e gerenciamento administrativo completo.

## Tipos de usuários

### Usuário comum
- Criar uma conta.
- Fazer login.
- Consultar seus próprios dados.
- Gerenciar suas receitas e vídeos nas próximas etapas.

### Administrador
- Realizar todas as ações do usuário comum.
- Acessar a rota administrativa protegida.
- Gerenciar recursos da plataforma nas próximas etapas.

## Tecnologias
- HTML5.
- CSS responsivo.
- JavaScript.
- Node.js.
- Express.
- MySQL.
- Fetch API.
- JWT.
- bcryptjs.

## Estrutura do projeto
```text
Organizar_Receitas/
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   ├── database/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── cadastro.html
│   ├── css/style.css
│   └── js/script.js
├── sql/
│   └── banco.sql
├── package.json
├── .env.example
└── .gitignore
```

## Configuração

### 1. Instalar dependências
Na pasta `Organizar_Receitas`, execute:

```bash
npm install
```

### 2. Criar o banco
Execute o arquivo `sql/banco.sql` pelo MySQL Workbench ou pelo terminal MySQL.

### 3. Configurar variáveis
Copie o arquivo de exemplo e preencha os dados locais:

```bash
copy .env.example .env
```

Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `JWT_SECRET`.
Não coloque senhas reais ou o arquivo `.env` em um repositório público.

### 4. Iniciar o servidor
Na pasta `Organizar_Receitas`, execute:

```bash
npm start
```

Acesse:

```text
http://localhost:3000
```

## API atual

### Cadastro
```text
POST /api/usuarios/cadastrar
```

```json
{
  "nome": "Maria Silva",
  "email": "maria@email.com",
  "senha": "123456"
}
```

O cadastro público sempre cria o usuário com o perfil `comum`.

### Login
```text
POST /api/usuarios/login
```

```json
{
  "email": "maria@email.com",
  "senha": "123456"
}
```

A resposta inclui um token JWT. Nas rotas protegidas, envie:

```text
Authorization: Bearer SEU_TOKEN
```

### Dados do usuário
```text
GET /api/usuarios/eu
```

Requer um usuário autenticado.

### Área administrativa
```text
GET /api/usuarios/admin
```

Requer autenticação e perfil `administrador`.

## Criar usuário administrador
As contas criadas pelo cadastro público são comuns. Para testar o administrador, cadastre uma conta normalmente e execute no MySQL:

```sql
USE organizar_receitas;

UPDATE usuarios
SET nivel = 'administrador'
WHERE email = 'email_do_administrador@email.com';
```

Faça login novamente para obter um novo token com o perfil atualizado.

Também existe esta conta de teste, caso tenha sido criada no banco:

```text
Email: admin@receitas.com
Senha: Admin123
```

## Como testar
1. Execute `sql/banco.sql`.
2. Configure o arquivo `.env`.
3. Execute `npm start`.
4. Cadastre um usuário em `http://localhost:3000/cadastro.html`.
5. Faça login em `http://localhost:3000`.
6. Teste a consulta dos próprios dados.
7. Promova uma conta para administrador pelo MySQL.
8. Faça login novamente e teste a área administrativa.
9. No MySQL, confirme a tabela de vídeos com `DESCRIBE videos_salvos;`.

### Validação esperada
- Sem token em `/api/usuarios/eu`: status `401`.
- Token válido em `/api/usuarios/eu`: status `200`.
- Usuário comum em `/api/usuarios/admin`: status `403`.
- Administrador em `/api/usuarios/admin`: status `200`.
- Senha incorreta: mensagem de email ou senha inválidos.

## Segurança atual
- Senhas armazenadas com hash bcryptjs.
- Email de usuário único.
- Senha e hash não são devolvidos pela API.
- Token JWT com tempo de validade configurável.
- Rota administrativa protegida por autenticação e autorização.
- Dados sensíveis armazenados em arquivo `.env`.
