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
    │   └── server.js
    ├── frontend/
    │   ├── css/style.css
    │   ├── js/script.js
    │   ├── index.html
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

5. Inicie o backend dentro de `Organizar_Receitas`:

   ```bash
   npm start
   ```

6. Abra `http://localhost:3000`. O Express serve o frontend e a API; não abra os arquivos HTML diretamente.

## Páginas
- `index.html`: página inicial, categorias, receitas públicas, login e painel pessoal.
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

### Categorias
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/categorias` | Público | Lista categorias |
| GET | `/api/categorias/:id/subcategorias` | Público | Lista subcategorias da categoria |

### Receitas
| Método | Caminho | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/receitas/publicas` | Público | Lista receitas públicas |
| GET | `/api/receitas/minhas` | Autenticado | Lista receitas próprias, públicas e privadas |
| GET | `/api/receitas/:id` | Público/autenticado | Consulta receita pública; privada somente pelo proprietário |
| POST | `/api/receitas` | Autenticado | Cadastra receita para o usuário do token |
| PUT | `/api/receitas/:id` | Proprietário autenticado | Atualiza uma receita própria |
| DELETE | `/api/receitas/:id` | Proprietário autenticado | Exclui uma receita própria |

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
- Receitas privadas de terceiros não são exibidas; a consulta do detalhe retorna `404`.
- Somente o proprietário pode editar ou excluir, mesmo que o solicitante seja administrador.
- O frontend pede confirmação antes da exclusão.
- A foto é informada por URL HTTP/HTTPS, pois o projeto ainda não implementa upload de arquivos.
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
9. Acesse `/api/health` para verificar a conexão com o MySQL.

## Segurança e validações
- Senhas protegidas com hash bcrypt.
- Consultas SQL parametrizadas.
- JWT validado no backend e usuário recarregado do banco a cada requisição protegida.
- Regras de propriedade aplicadas no backend; esconder botões no frontend não é considerado controle de acesso.
- Entradas obrigatórias, categoria, subcategoria, privacidade e URL da foto validadas na API.
