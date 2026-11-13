# Organizador de Receitas

Aplicação web para cadastrar e organizar receitas próprias, controlar sua privacidade e descobrir receitas compartilhadas publicamente.

## Tecnologias
- HTML5, CSS e JavaScript.
- Node.js e Express.
- MySQL com `mysql2`.
- Fetch API.
- JWT para autenticação.
- `bcryptjs` para proteger senhas.

## Estrutura
```text
Receitas/
├── .gitignore
├── README.md
└── Organizar_Receitas/
    ├── backend/
    │   ├── controllers/       # Regras de usuários, categorias e receitas
    │   ├── database/          # Pool de conexão MySQL
    │   ├── middlewares/       # Autenticação e autorização
    │   ├── routes/            # Rotas da API
    │   ├── uploads/           # Mantém imagens enviadas anteriormente; ignorada pelo Git
    │   └── server.js
    ├── frontend/
    │   ├── css/style.css
    │   ├── js/script.js
    │   ├── index.html
    │   ├── admin.html
    │   ├── cadastro.html
    │   ├── minhas-receitas.html
    │   ├── receita-form.html
    │   └── receita-detalhes.html
    ├── sql/banco.sql
    ├── package.json
    ├── package-lock.json
    └── .env.example
```

## Configuração
1. Instale o Node.js e o MySQL.
2. Na pasta `Organizar_Receitas`, instale as dependências:

   ```bash
   npm install
   ```

3. Execute `sql/banco.sql` no MySQL Workbench ou cliente MySQL. O script cria o banco, as tabelas e as categorias iniciais.
4. Copie `.env.example` para `.env` e preencha as configurações:

   ```text
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   DB_NAME=organizar_receitas
   JWT_SECRET=uma_chave_longa_e_aleatoria
   JWT_EXPIRES_IN=2h
   ```

   Não envie `.env` ou credenciais reais para o repositório.

5. Inicie o backend dentro da pasta `Organizar_Receitas/backend`:

   ```bash
   node server.js
   ```

6. Abra o site de uma destas formas:
   - Acesse `http://localhost:3000`, servido pelo Express.
   - Para usar a extensão Go Live, deixe o backend executando e abra `frontend/index.html` com Go Live. As chamadas da API serão direcionadas para `http://localhost:3000`.

   O Go Live serve apenas o frontend. Para que login, categorias e receitas funcionem, mantenha `node server.js` rodando no terminal da pasta `Organizar_Receitas/backend`.

## Páginas
- `index.html`: página inicial, categorias, receitas públicas, login e painel pessoal.
- `admin.html`: área restrita para administrar receitas, níveis de usuário, categorias e textos e imagens de todas as páginas, sem alterar o layout ou as funcionalidades.
- `cadastro.html`: cadastro de usuário.
- `minhas-receitas.html`: consulta, filtros, edição e exclusão das receitas do usuário.
- `receita-form.html`: cadastro e edição de receita.
- `receita-detalhes.html`: detalhes, ingredientes e etapas de preparo.

## API

### Usuários
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| POST | `/api/usuarios/cadastrar` | Público | Cadastra uma conta comum |
| POST | `/api/usuarios/login` | Público | Autentica e retorna JWT |
| GET | `/api/usuarios/eu` | Autenticado | Consulta os dados da conta |
| GET | `/api/usuarios/admin` | Administrador | Verifica acesso administrativo |
| GET | `/api/usuarios/admin/usuarios` | Administrador | Lista contas e seus níveis de acesso |
| PUT | `/api/usuarios/admin/usuarios/:id/nivel` | Administrador | Altera o nível de uma conta; não exclui contas nem permite remover o próprio acesso |

### Categorias
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/categorias` | Público | Lista categorias |
| GET | `/api/categorias/:id/subcategorias` | Público | Lista subcategorias da categoria |
| POST | `/api/categorias` | Administrador | Cria categoria |
| PUT | `/api/categorias/:id` | Administrador | Edita categoria |
| DELETE | `/api/categorias/:id` | Administrador | Exclui categoria sem receitas ou vídeos associados |
| POST | `/api/categorias/:id/subcategorias` | Administrador | Cria subcategoria |
| PUT | `/api/categorias/subcategorias/:id` | Administrador | Edita subcategoria |
| DELETE | `/api/categorias/subcategorias/:id` | Administrador | Exclui subcategoria |

### Receitas
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/receitas/publicas` | Público | Lista receitas públicas |
| GET | `/api/receitas/minhas` | Autenticado | Lista receitas próprias, públicas e privadas |
| GET | `/api/receitas/administracao` | Administrador | Lista receitas públicas e privadas de todas as contas |
| GET | `/api/receitas/:id` | Público/autenticado | Consulta receita pública; privada pelo proprietário ou administrador |
| POST | `/api/receitas` | Autenticado | Cadastra receita para o usuário do token |
| PUT | `/api/receitas/:id` | Proprietário ou administrador | Atualiza receita própria ou de qualquer usuário |
| DELETE | `/api/receitas/:id` | Proprietário ou administrador | Exclui receita própria ou de qualquer usuário |

### Imagens e conteúdo do site
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/configuracoes` | Público | Consulta os textos e as imagens configuráveis das páginas |
| PUT | `/api/configuracoes` | Administrador | Atualiza textos e imagens permitidos nas páginas existentes |

As imagens de receitas e do conteúdo do site são informadas por links diretos HTTP ou HTTPS. Links para páginas de busca ou publicações não funcionam como imagem direta. O envio de novos arquivos locais não está disponível. Imagens enviadas anteriormente continuam armazenadas e podem ser exibidas.

As rotas protegidas recebem o token no cabeçalho:

```text
Authorization: Bearer SEU_TOKEN
```

Filtros opcionais de listagem:
- `busca`: procura pelo título ou descrição.
- `categoria`: filtra pelo ID de categoria.
- `privacidade`: `publica` ou `privada`, somente em `/api/receitas/minhas`.

## CRUD de receitas e regras
- O cadastro exige título, ingredientes, modo de preparo e categoria.
- A categoria precisa existir; a subcategoria, se informada, deve pertencer a ela.
- A privacidade aceita `publica` ou `privada`.
- O `usuario_id` é obtido no backend a partir do token JWT, nunca do formulário.
- Usuários autenticados podem consultar suas próprias receitas privadas.
- Receitas privadas de terceiros não são exibidas; para usuários comuns, a consulta do detalhe retorna `404`.
- Administradores podem consultar, editar e excluir qualquer receita. Usuários comuns só podem editar ou excluir as próprias receitas.
- Administradores podem alterar níveis de acesso, mas não podem excluir contas nem remover o próprio nível administrativo.
- Categorias em uso por receitas ou vídeos não podem ser excluídas; a API retorna `409`.
- Textos e imagens configuráveis das páginas são armazenados no banco; novas imagens devem ser informadas por URL HTTP/HTTPS.
- O frontend pede confirmação antes da exclusão.
- Fotos novas de receitas devem usar links diretos HTTP/HTTPS; links de busca ou páginas de publicação não são imagens diretas.
- A pasta `Organizar_Receitas/backend/uploads/` é mantida para exibir fotos enviadas antes da remoção do upload local e continua ignorada pelo Git.
- Ingredientes e modo de preparo podem ser escritos um por linha; os detalhes mostram listas e etapas.
- Vídeos salvos já possuem modelagem no banco, mas o CRUD de vídeos não faz parte desta entrega.

## Testes manuais sugeridos
1. Cadastre duas contas e faça login para obter tokens diferentes.
2. Com a primeira conta, cadastre uma receita privada e uma pública.
3. Confirme que `/api/receitas/minhas` retorna as duas receitas do proprietário.
4. Confirme que `/api/receitas/publicas` retorna apenas a receita pública.
5. Consulte a receita privada com o token de outra conta e confirme resposta `404`.
6. Tente editar e excluir uma receita da outra conta; ambas devem retornar `403`.
7. Edite e exclua a própria receita; confirme as respostas `200`.
8. Teste cadastro sem token (`401`), dados obrigatórios ausentes (`400`), ID inexistente (`404`) e usuário comum na rota administrativa (`403`).
9. Entre com uma conta administradora e use `admin.html` para gerenciar perfis, receitas, categorias, subcategorias e os textos e imagens de todas as páginas; confirme que as alterações aparecem no site.
10. Tente excluir uma categoria que esteja em uso e confirme a resposta `409`; tente remover seu próprio perfil administrativo e confirme a recusa.
11. Acesse `/api/health` para verificar a conexão com o MySQL.
12. Informe um link direto HTTP/HTTPS para a foto de uma receita e para as imagens configuráveis; confirme a prévia e salve as alterações. A seleção de arquivos locais não está disponível.

## Segurança e validações
- Senhas protegidas com hash bcrypt.
- Consultas SQL parametrizadas.
- JWT validado no backend e usuário recarregado do banco a cada requisição protegida.
- Regras de propriedade aplicadas no backend; esconder botões no frontend não é considerado controle de acesso.
- Entradas obrigatórias, categoria, subcategoria, privacidade e URLs de imagem validadas na API.
