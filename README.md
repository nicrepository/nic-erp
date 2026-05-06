# N-HUB ERP

Sistema ERP web para gestão operacional interna, com módulos de autenticação, usuários, dashboard, helpdesk, inventário, recursos humanos, fiscal e compras.

O projeto é composto por uma API Java/Spring Boot, um frontend React/Vite e banco PostgreSQL versionado por Flyway.

## Sumário

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Módulos do Sistema](#módulos-do-sistema)
- [Segurança](#segurança)
- [Banco de Dados e Migrações](#banco-de-dados-e-migrações)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Execução Local](#execução-local)
- [Execução com Docker](#execução-com-docker)
- [Testes e Qualidade](#testes-e-qualidade)
- [Administração do Sistema](#administração-do-sistema)
- [Guia de Uso por Módulo](#guia-de-uso-por-módulo)
- [Deploy e Operação](#deploy-e-operação)
- [Troubleshooting](#troubleshooting)

## Visão Geral

O N-HUB ERP centraliza rotinas administrativas e operacionais:

- Controle de acesso por cargos e permissões.
- Gestão de usuários e senha inicial obrigatória.
- Trilha de auditoria administrativa e operacional.
- Dashboard com visão consolidada.
- Helpdesk com categorias, chamados, comentários e anexos.
- Inventário administrativo com categorias, valores, movimentações e balanço patrimonial.
- Inventário de TI com ativos, atribuição, histórico e baixa.
- RH com colaboradores, status e afastamentos.
- Fiscal com fornecedores, notas recebidas, anexos XML/PDF, lançamento e conciliação.
- Compras com solicitações, pedidos, recebimento parcial/total e vínculo com notas fiscais.

## Tecnologias

### Backend

- Java 21
- Spring Boot 4.0.2
- Spring Web MVC
- Spring Security
- Spring Data JPA
- Hibernate
- PostgreSQL
- Flyway
- Bean Validation
- Java JWT `com.auth0:java-jwt`
- Spring Mail
- Springdoc OpenAPI/Swagger
- Lombok
- Maven Wrapper
- OWASP Dependency Check

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Radix UI
- Tailwind CSS
- Lucide React
- Recharts
- jwt-decode
- `apiFetch` interno para requisições autenticadas e tratamento padronizado de erros

### Infraestrutura

- PostgreSQL 16
- Docker / Docker Compose
- Nginx para servir o frontend em produção
- Traefik no compose de produção
- Volumes Docker para banco e uploads

## Arquitetura

Estrutura principal:

```text
.
├── erp/                  # Backend Spring Boot
│   ├── src/main/java
│   ├── src/main/resources/db/migration
│   ├── src/test/java
│   ├── Dockerfile
│   └── pom.xml
├── frontend/             # Frontend React + Vite
│   ├── src
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── compose.yml
├── .env.example
└── erp_backend.env.example
```

O backend segue uma divisão por domínio:

- `auth`: autenticação, usuários, cargos e permissões.
- `dashboard`: indicadores agregados.
- `helpdesk`: chamados, categorias, comentários e anexos.
- `inventory`: estoque administrativo e ativos de TI.
- `hr`: colaboradores e afastamentos.
- `fiscal`: fornecedores, notas fiscais recebidas, anexos e conciliação.
- `purchasing`: solicitações, pedidos e recebimento de compras.
- `storage`: persistência e entrega de arquivos.
- `notification`: notificações e e-mail.
- `audit`: trilha de ações administrativas e operacionais.

O frontend possui páginas por módulo em `frontend/src/pages` e usa rotas privadas dentro do layout principal.

## Módulos do Sistema

### Autenticação e Usuários

Funcionalidades:

- Login com JWT.
- Recuperação de senha por e-mail.
- Troca de senha pelo usuário autenticado.
- Definição obrigatória de senha no primeiro acesso.
- Upload de avatar.
- Cadastro, edição, desativação/exclusão lógica e atribuição de cargos.
- Administração de cargos e permissões.

Principais rotas:

- `/auth/login`
- `/auth/me`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/users`
- `/roles`

### Dashboard

Funcionalidades:

- Tela de visão geral.
- Indicadores consolidados de módulos operacionais.
- Acesso protegido por permissão específica.

Permissão:

- `ACCESS_DASHBOARD`
- `ROLE_ADMIN`

### Helpdesk

Funcionalidades:

- Abertura de chamados.
- Listagem de chamados próprios e por departamento.
- Categorias configuráveis.
- Atribuição para atendentes.
- Alteração de status.
- Comentários.
- Anexos.

Permissões principais:

- Usuários podem abrir e acompanhar seus chamados.
- `ACCESS_HELPDESK`, `ROLE_TI` ou `ROLE_ADMIN` podem gerenciar fila, atribuição e status.
- Categorias são administradas por `ROLE_ADMIN`.

### Inventário Administrativo

Funcionalidades:

- Cadastro de categorias de estoque.
- Cadastro de itens administrativos.
- Campo de valor unitário.
- Entrada e saída de quantidade.
- Histórico de movimentações.
- Valores unitários e totais no histórico.
- Balanço patrimonial baseado nos valores cadastrados.
- Alertas de baixo estoque.

Permissões:

- `ACCESS_INVENTORY_ADMIN`
- `ROLE_ADMIN`

### Inventário de TI

Funcionalidades:

- Cadastro de ativos de TI.
- Atribuição de ativo a colaborador/usuário.
- Desatribuição.
- Edição.
- Baixa de ativo.
- Histórico do ativo.

Permissões:

- `ACCESS_INVENTORY_IT`
- `ROLE_ADMIN`

### Recursos Humanos

Funcionalidades:

- Cadastro de colaboradores.
- Edição e exclusão lógica.
- Controle de status.
- Registro de afastamentos.
- Sincronização automática de status conforme afastamentos.
- Notificações relacionadas a afastamentos.

Permissões:

- `ACCESS_HR`
- `ROLE_ADMIN`

### Fiscal

Funcionalidades:

- Cadastro e manutenção de fornecedores.
- Cadastro de notas fiscais recebidas.
- Itens da nota fiscal.
- Anexos de DANFE/PDF, XML e outros arquivos permitidos.
- Status de nota:
  - Recebida.
  - Em conferência.
  - Divergente.
  - Validada.
  - Lançada.
  - Cancelada.
- Vínculo opcional com pedido de compra.
- Lançamento fiscal com entrada automática no estoque quando o item está marcado para entrar em estoque.
- Conciliação Pedido x Recebimento x Nota Fiscal.

Conciliação fiscal:

- Compara fornecedor do pedido com fornecedor da nota.
- Compara valor total do pedido com valor total da nota.
- Compara item a item por `stockItemId` ou descrição.
- Compara quantidade pedida, quantidade recebida e quantidade faturada.
- Compara valor unitário do pedido com valor unitário da nota.
- Exibe status:
  - `Sem vínculo`
  - `Conciliada`
  - `Divergente`
  - `Falta na NF`
  - `Fora do pedido`
- Bloqueia lançamento de nota vinculada quando houver divergência crítica.

Permissões:

- `ACCESS_FISCAL`
- `ROLE_ADMIN`

### Compras

Funcionalidades:

- Solicitações internas de compra.
- Status de solicitação:
  - Rascunho.
  - Enviada.
  - Aprovada.
  - Reprovada.
  - Pedido gerado.
  - Cancelada.
- Pedidos de compra vinculados a fornecedor e, opcionalmente, a uma solicitação aprovada.
- Itens com quantidade, categoria, valor unitário e vínculo opcional com item de estoque.
- Status de pedido:
  - Aberto.
  - Enviado ao fornecedor.
  - Parcialmente recebido.
  - Recebido.
  - Vinculado à NF.
  - Encerrado.
  - Cancelado.
- Recebimento parcial/total por item.
- Saldo pendente por item.
- Integração com Fiscal para vínculo com NF recebida.

Permissões:

- `ACCESS_PURCHASES`
- `ROLE_ADMIN`

### Comunicados

Funcionalidades:

- Publicação de comunicados com imagem.
- Listagem pública autenticada.
- Gestão protegida por permissão.

Permissões:

- `ACCESS_ANNOUNCEMENTS_MANAGE`
- `ROLE_ADMIN`

### Notificações

Funcionalidades:

- Consulta de notificações do usuário autenticado.
- Marcação de notificação como lida.
- Uso por rotinas internas, como RH.

### Auditoria

Funcionalidades:

- Registro de ações críticas do sistema.
- Consulta administrativa em `Configurações > Auditoria`.
- Filtro por texto e módulo.
- Registro de usuário executor, data/hora, ação, módulo, entidade e detalhes.

Eventos iniciais auditados:

- Criação, edição, desativação e alteração de cargos de usuários.
- Criação, edição, exclusão e alteração de permissões de cargos.
- Cadastro, edição, exclusão e movimentações do estoque administrativo.
- Cadastro, edição e remoção de colaboradores.

Permissão:

- `ROLE_ADMIN`

## Segurança

### Autenticação

O sistema usa autenticação stateless com JWT.

- Login gera token JWT.
- O frontend armazena o token no `localStorage`.
- Requisições autenticadas enviam `Authorization: Bearer <token>`.
- A API valida o token em filtro de segurança antes dos controllers.
- O frontend limpa a sessão e redireciona para login quando a API retorna `401`.
- O frontend exibe aviso amigável quando a API retorna `403`.

### Autorização

O controle de acesso combina:

- Cargos, como `ROLE_ADMIN`, `ROLE_USER`, `ROLE_TI`.
- Permissões granulares, como `ACCESS_FISCAL`, `ACCESS_PURCHASES`, `ACCESS_HR`.

As permissões são aplicadas no backend com `@PreAuthorize` e no frontend para exibição de menus e redirecionamento inicial. As permissões legadas continuam válidas para compatibilidade, enquanto permissões granulares permitem separar visualização e gestão por módulo.

Permissões cadastradas no seed:

- `ACCESS_INVENTORY_ADMIN`
- `ACCESS_INVENTORY_ADMIN_VIEW`
- `ACCESS_INVENTORY_ADMIN_MANAGE`
- `ACCESS_INVENTORY_IT`
- `ACCESS_INVENTORY_IT_VIEW`
- `ACCESS_INVENTORY_IT_MANAGE`
- `ACCESS_HELPDESK`
- `ACCESS_HELPDESK_VIEW`
- `ACCESS_HELPDESK_MANAGE`
- `ACCESS_HELPDESK_CATEGORIES_MANAGE`
- `ACCESS_USERS`
- `ACCESS_USERS_VIEW`
- `ACCESS_USERS_MANAGE`
- `ACCESS_ROLES_MANAGE`
- `ACCESS_DASHBOARD`
- `ACCESS_ANNOUNCEMENTS_MANAGE`
- `ACCESS_FISCAL`
- `ACCESS_PURCHASES`
- `ACCESS_HR`
- `ACCESS_HR_VIEW`
- `ACCESS_HR_MANAGE`

### Senhas

- Hash de senha com BCrypt custo 12.
- Não existe senha padrão fixa para administrador.
- `ADMIN_SEED_PASSWORD` é obrigatório.
- Usuários podem ser obrigados a trocar senha no primeiro login.
- Recuperação de senha usa token temporário.

### Headers e Sessão

Configurações aplicadas:

- API stateless.
- CSRF desabilitado por não usar sessão/cookie.
- HSTS habilitado.
- `frameOptions` como `deny`.
- `contentTypeOptions`.
- Referrer Policy `STRICT_ORIGIN_WHEN_CROSS_ORIGIN`.
- Swagger restrito a `ROLE_ADMIN`.

### Uploads

O serviço de storage aplica controles de segurança:

- Bloqueio de nomes com path traversal (`..`).
- Lista permitida de tipos:
  - JPEG
  - PNG
  - GIF
  - WebP
  - PDF
  - XML
- Verificação de magic bytes para imagens e PDF.
- XML validado para evitar conteúdo com `DOCTYPE` ou `ENTITY`.
- Limite de arquivo: 10 MB.
- Limite de requisição multipart: 15 MB.

### Recomendações de Produção

- Definir `NIC_ERP_JWT_SECRET` com valor aleatório forte, mínimo 32 caracteres.
- Definir `ADMIN_SEED_PASSWORD` forte apenas via secret/env.
- Trocar a senha do administrador inicial após o primeiro login.
- Usar HTTPS obrigatoriamente.
- Restringir acesso direto ao backend e banco.
- Fazer backup dos volumes de banco e uploads.
- Monitorar a trilha de auditoria em alterações administrativas sensíveis.
- Não commitar `.env` ou arquivos reais de segredo.

## Banco de Dados e Migrações

O banco é PostgreSQL e o schema é versionado por Flyway.

Configuração principal:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
spring.flyway.baseline-on-migrate=true
```

Isso significa que:

- O Hibernate valida o schema.
- O Flyway é responsável por criar/evoluir tabelas.
- Mudanças estruturais devem ser feitas via nova migration em `erp/src/main/resources/db/migration`.

Principais schemas/domínios:

- `auth`: usuários, cargos e permissões.
- `helpdesk`: chamados, categorias e anexos.
- `inventory`: estoque administrativo, ativos de TI e movimentações.
- `hr`: colaboradores e afastamentos.
- `fiscal`: fornecedores, notas, itens e anexos fiscais.
- `purchasing`: solicitações, pedidos e recebimento.
- `audit`: eventos de auditoria.

Migrações atuais vão de `V1` a `V29`.

## Configuração de Ambiente

### Variáveis principais do backend

| Variável | Descrição | Obrigatória |
|---|---|---|
| `SPRING_DATASOURCE_URL` | URL JDBC do PostgreSQL | Sim |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco | Sim |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco | Sim |
| `NIC_ERP_JWT_SECRET` | Segredo JWT forte | Sim em produção |
| `ADMIN_SEED_NAME` | Nome do admin inicial | Não |
| `ADMIN_SEED_EMAIL` | E-mail do admin inicial | Não |
| `ADMIN_SEED_PASSWORD` | Senha do admin inicial | Sim |
| `SPRING_MAIL_USERNAME` | Usuário SMTP | Sim em produção |
| `SPRING_MAIL_PASSWORD` | Senha SMTP | Sim em produção |
| `FILE_UPLOAD_DIR` | Diretório de uploads | Recomendado |
| `APP_FRONTEND_URL` | URL usada em links de recuperação de senha | Recomendado |

Exemplo local:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/nicerp_db
SPRING_DATASOURCE_USERNAME=nicerp_user
SPRING_DATASOURCE_PASSWORD=nicerp_password
NIC_ERP_JWT_SECRET=troque-por-um-segredo-com-mais-de-32-caracteres
ADMIN_SEED_NAME=Administrador
ADMIN_SEED_EMAIL=admin@nic-labs.com
ADMIN_SEED_PASSWORD=troque-por-uma-senha-forte
SPRING_MAIL_USERNAME=dev@example.com
SPRING_MAIL_PASSWORD=
FILE_UPLOAD_DIR=./uploads
APP_FRONTEND_URL=http://localhost:5173
```

Use `NIC_ERP_JWT_SECRET` com um valor forte e aleatório em qualquer ambiente fora de desenvolvimento local.

## Execução Local

### Pré-requisitos

- Java 21.
- Node.js compatível com Vite 7.
- npm.
- PostgreSQL 16.
- Maven Wrapper já incluso no backend.

### Banco local

Crie banco e usuário conforme as variáveis:

```sql
CREATE DATABASE nicerp_db;
CREATE USER nicerp_user WITH PASSWORD 'nicerp_password';
GRANT ALL PRIVILEGES ON DATABASE nicerp_db TO nicerp_user;
```

### Backend

No diretório `erp`:

```bash
cd erp
./mvnw spring-boot:run
```

No Windows PowerShell:

```powershell
cd erp
.\mvnw spring-boot:run
```

A API sobe em:

```text
http://localhost:8080
```

Swagger/OpenAPI, quando autenticado como admin:

```text
http://localhost:8080/swagger-ui/index.html
```

### Frontend

No diretório `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Frontend local:

```text
http://localhost:5173
```

O Vite possui proxy para a API em `localhost:8080`.

## Execução com Docker

O arquivo `compose.yml` define:

- `erp_db`: PostgreSQL 16.
- `erp_backend`: API Spring Boot.
- `erp_frontend`: build React servido por Nginx.

O compose está preparado para um ambiente de produção em `/opt/nic-labs/core`, usando rede externa `core_nic_net` e Traefik.

Antes de subir:

1. Crie o arquivo de secrets baseado em `erp_backend.env.example`.
2. Defina senhas fortes.
3. Garanta que a rede externa exista.
4. Garanta que Traefik esteja configurado, se for usar o compose como está.

Comando:

```bash
docker compose -f compose.yml up -d --build
```

Para ambiente local, talvez seja necessário ajustar:

- `build.context`.
- Caminho de `env_file`.
- Rede externa.
- Host do Traefik.

## Testes e Qualidade

### Backend

Executar todos os testes:

```bash
cd erp
./mvnw test
```

No Windows:

```powershell
cd erp
.\mvnw test
```

Executar testes específicos:

```powershell
.\mvnw "-Dtest=FiscalServiceTest,PurchasingServiceTest" test
```

Testes existentes cobrem:

- Usuários e autenticação.
- Autorização granular por permissões de visualização e gestão.
- Estoque administrativo.
- RH.
- Fiscal.
- Compras.
- Contexto da aplicação com Flyway/PostgreSQL.

Observação: os testes de contexto usam PostgreSQL configurado nas variáveis da aplicação. Certifique-se de que o banco esteja disponível antes de rodar a suíte completa.

### Frontend

Build de produção:

```bash
cd frontend
npm run build
```

Lint:

```bash
npm run lint
```

Preview do build:

```bash
npm run preview
```

### Verificação de Dependências

O backend possui OWASP Dependency Check configurado no Maven:

```bash
cd erp
./mvnw verify
```

O build falha para vulnerabilidades com CVSS igual ou maior que 7, conforme configuração do plugin.

## Administração do Sistema

### Primeiro Acesso

No primeiro boot com banco vazio:

1. O sistema cria permissões padrão.
2. O sistema cria `ROLE_ADMIN` com todas as permissões.
3. O sistema cria `ROLE_USER`.
4. O usuário administrador inicial é criado com:
   - `ADMIN_SEED_NAME`
   - `ADMIN_SEED_EMAIL`
   - `ADMIN_SEED_PASSWORD`

Após login:

1. Troque a senha do administrador inicial.
2. Crie cargos operacionais conforme a empresa.
3. Atribua permissões a cada cargo.
4. Cadastre usuários finais.

### Gestão de Cargos e Permissões

Acesse `Configurações`.

Operações:

- Criar cargo.
- Editar nome de cargo.
- Vincular permissões.
- Remover cargo não protegido.

Cargos protegidos:

- `ROLE_ADMIN`
- `ROLE_USER`

Boas práticas:

- Use `ROLE_ADMIN` apenas para administradores reais.
- Use permissões `*_VIEW` para cargos que precisam apenas consultar dados.
- Use permissões `*_MANAGE` para cargos que podem criar, editar, excluir, movimentar ou alterar status.
- Prefira permissões granulares em novos cargos; mantenha permissões legadas apenas para compatibilidade com cargos já existentes.
- Crie cargos específicos para áreas:
  - Fiscal.
  - Compras.
  - RH.
  - TI.
  - Estoque administrativo.
- Atribua o menor conjunto de permissões necessário.

### Gestão de Usuários

Acesse `Usuários`.

Operações:

- Criar usuário.
- Editar dados.
- Atribuir cargos.
- Remover/desativar.
- Usuário pode trocar a própria senha.
- Usuário pode alterar avatar.

### Backups

Itens críticos:

- Banco PostgreSQL.
- Volume de uploads.
- Arquivo de secrets/env.

Recomendações:

- Backup diário do banco.
- Backup frequente do volume `erp_uploads`.
- Teste periódico de restauração.
- Retenção compatível com exigências internas.

### Atualização do Sistema

Fluxo recomendado:

1. Fazer backup do banco e uploads.
2. Revisar novas migrations Flyway.
3. Rodar testes.
4. Buildar imagens.
5. Subir containers.
6. Conferir logs do backend.
7. Validar login e principais módulos.

## Guia de Uso por Módulo

### Login e Perfil

1. Acesse a URL do sistema.
2. Informe e-mail e senha.
3. No primeiro acesso, defina uma senha pessoal se solicitado.
4. Use o avatar no topo para identificar usuário.
5. Acesse configurações de perfil para trocar senha ou avatar.

### Dashboard

1. Acesse `Visão Geral`.
2. Consulte os indicadores consolidados.
3. Caso a tela não apareça, verifique se o usuário possui `ACCESS_DASHBOARD` ou `ROLE_ADMIN`.

### Helpdesk

Para abrir chamado:

1. Acesse `Helpdesk`.
2. Clique em novo chamado.
3. Selecione categoria.
4. Informe título e descrição.
5. Anexe arquivo se necessário.
6. Envie.

Para atendimento:

1. Acesse a fila.
2. Filtre por departamento/status.
3. Atribua responsável.
4. Atualize status.
5. Comente no chamado.
6. Finalize quando resolvido.

Para administrar categorias:

1. Acesse `Configurações`.
2. Use a área de categorias do Helpdesk.
3. Defina departamento e prioridade automática.

### Inventário Administrativo

Para configurar categorias:

1. Acesse `Inventário`.
2. Abra o cadastro de categorias.
3. Crie categorias padronizadas.

Para cadastrar item:

1. Acesse estoque administrativo.
2. Clique em novo item.
3. Informe nome, categoria, quantidade mínima e valor unitário.
4. Salve.

Para movimentar estoque:

1. Selecione item.
2. Use entrada ou saída.
3. Informe quantidade e observação.
4. Consulte o histórico.

Para balanço patrimonial:

1. Mantenha o valor unitário dos itens atualizado.
2. Consulte os cards e listagens do inventário.
3. Verifique totais por quantidade em estoque.

### Inventário de TI

Para cadastrar ativo:

1. Acesse `Inventário`.
2. Vá para área de ativos de TI.
3. Cadastre equipamento, identificação e detalhes.

Para atribuir ativo:

1. Selecione o ativo.
2. Clique em atribuir.
3. Escolha usuário/colaborador.
4. Salve.

Para baixa:

1. Selecione ativo.
2. Use opção de baixa.
3. Informe motivo.
4. Consulte histórico quando necessário.

### Recursos Humanos

Para cadastrar colaborador:

1. Acesse `Recursos Humanos`.
2. Clique em novo colaborador.
3. Informe dados pessoais e profissionais.
4. Salve.

Para registrar afastamento:

1. Acesse a área de afastamentos.
2. Escolha colaborador.
3. Informe período e motivo.
4. Salve.

O sistema atualiza status conforme afastamentos e pode gerar notificações.

### Fiscal

Para cadastrar fornecedor:

1. Acesse `Fiscal`.
2. Vá para `Fornecedores`.
3. Clique em novo fornecedor.
4. Informe razão social, documento, contato fiscal e categoria.
5. Salve.

Para cadastrar nota recebida:

1. Acesse `Fiscal`.
2. Vá para `Notas Recebidas`.
3. Clique em nova nota.
4. Selecione fornecedor.
5. Vincule pedido de compra, se houver.
6. Informe número, série, chave, datas e valores.
7. Informe itens da nota.
8. Marque itens que entram no estoque quando aplicável.
9. Anexe PDF/XML.
10. Salve.

Fluxo recomendado de status:

1. `Recebida`
2. `Em conferência`
3. `Validada` ou `Divergente`
4. `Lançada`

Para lançar NF:

1. A nota deve estar `Validada`.
2. Se estiver vinculada a pedido, a conciliação não pode estar divergente.
3. Itens marcados como entrada em estoque precisam estar vinculados a um material.
4. Clique em lançar.
5. O estoque recebe a entrada automaticamente.

Para usar conciliação:

1. Vincule a nota a um pedido de compra.
2. Confira o status de conciliação na listagem.
3. Abra detalhes da nota.
4. Verifique fornecedor, valor total e comparação item a item.
5. Corrija pedido, recebimento ou nota antes de lançar, caso exista divergência.

### Compras

Para criar solicitação:

1. Acesse `Compras`.
2. Vá para `Solicitações`.
3. Clique em nova solicitação.
4. Informe título, centro de custo e justificativa.
5. Adicione itens.
6. Salve como rascunho.

Fluxo de solicitação:

1. Rascunho.
2. Enviar.
3. Aprovar ou reprovar.
4. Gerar pedido a partir de solicitação aprovada.

Para criar pedido:

1. Acesse `Compras`.
2. Vá para `Pedidos`.
3. Clique em novo pedido.
4. Escolha fornecedor.
5. Opcionalmente vincule solicitação aprovada.
6. Informe número, emissão e previsão.
7. Adicione itens.
8. Salve.

Para receber pedido:

1. Na lista de pedidos, clique em `Receber`.
2. Informe a quantidade recebida por item.
3. Salve.
4. O pedido fica `Parcialmente recebido` ou `Recebido`.

Para integrar com Fiscal:

1. Cadastre a NF recebida no módulo Fiscal.
2. Vincule a NF ao pedido.
3. Confira a conciliação.
4. Lance a NF quando estiver conciliada.

### Configurações

Use para:

- Gerenciar cargos.
- Gerenciar permissões.
- Alterar senha.
- Configurar categorias de Helpdesk.
- Ajustar dados administrativos disponíveis no sistema.

## Deploy e Operação

### Build Manual

Backend:

```bash
cd erp
./mvnw package
```

Frontend:

```bash
cd frontend
npm run build
```

### Logs

Docker:

```bash
docker logs -f erp_backend
docker logs -f erp_frontend
docker logs -f erp_db
```

### Healthchecks

O compose define healthchecks para:

- PostgreSQL via `pg_isready`.
- Backend via porta 8080.

### Arquivos

Uploads são persistidos em:

- Local: valor de `FILE_UPLOAD_DIR`.
- Docker: volume `erp_uploads` montado em `/app/uploads`.

## Troubleshooting

### Backend não inicia por `ADMIN_SEED_PASSWORD`

Defina a variável:

```bash
ADMIN_SEED_PASSWORD=uma-senha-forte
```

O sistema não possui fallback para senha do admin inicial.

### Erro de conexão com PostgreSQL

Verifique:

- Banco está rodando.
- Porta 5432 acessível.
- `SPRING_DATASOURCE_URL` correta.
- Usuário e senha corretos.
- Banco `nicerp_db` existe.

### Flyway falha ao iniciar

Verifique:

- Ordem e nome das migrations.
- Se a migration já foi aplicada.
- Se houve alteração manual em migration antiga.
- Logs do backend para mensagem exata.

### Login funciona mas menu não aparece

Verifique:

- Cargos do usuário.
- Permissões vinculadas ao cargo.
- Token antigo no navegador.

Solução comum:

1. Atualize permissões do cargo.
2. Faça logout.
3. Faça login novamente.

### Dashboard não carrega

Verifique:

- Usuário possui `ACCESS_DASHBOARD` ou `ROLE_ADMIN`.
- Backend está respondendo `/dashboard`.
- Token JWT está válido.

### Upload recusado

Verifique:

- Tipo de arquivo permitido.
- Tamanho máximo de 10 MB por arquivo.
- Conteúdo real do arquivo corresponde ao MIME.
- XML não contém `DOCTYPE` ou `ENTITY`.

### NF não lança

Possíveis causas:

- Nota não está validada.
- Nota vinculada possui conciliação divergente.
- Item que entra no estoque não está vinculado a material.
- Quantidade do item de estoque não é inteira.

### Pedido não recebe item

Possíveis causas:

- Pedido encerrado ou cancelado.
- Quantidade recebida maior que saldo pendente.
- Item informado não pertence ao pedido.

## Convenções de Desenvolvimento

- Criar migrations novas para mudanças de schema.
- Não alterar migrations já aplicadas em ambientes compartilhados.
- Manter validações de autorização no backend, mesmo quando o frontend oculta menus.
- Usar DTOs para entrada/saída de API.
- Cobrir regras de negócio com testes unitários.
- Rodar `npm run build` antes de entregar alterações no frontend.
- Rodar `.\mvnw test` antes de entregar alterações no backend.

## Status Atual

Última validação realizada:

- Backend: `.\mvnw test`
- Resultado: 42 testes, 0 falhas.
- Frontend: `npm run build`
- Resultado: build concluído com sucesso.

O sistema já possui um fluxo integrado de Compras, Fiscal e Estoque:

```text
Solicitação de Compra
      ↓
Pedido de Compra
      ↓
Recebimento parcial/total
      ↓
Nota Fiscal recebida vinculada
      ↓
Conciliação
      ↓
Lançamento da NF
      ↓
Entrada no Estoque
```
