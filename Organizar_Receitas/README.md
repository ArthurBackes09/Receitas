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

## Estado da primeira entrega
Esta entrega apresenta planejamento, estrutura de pastas e interface inicial. Banco de dados completo, CRUD funcional, autenticação e JWT não estão implementados. Os formulários e botões são apenas protótipos visuais para preparar as entregas seguintes.

## Banco de dados
Execute o arquivo `sql/banco.sql` em uma conexão MySQL. Ele cria o banco `organizar_receitas`, as tabelas relacionadas e as categorias iniciais.

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
- `sql/`: espaço reservado para os scripts do banco de dados.
