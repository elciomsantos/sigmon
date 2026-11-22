<div align="center">
  <img src="public/images/Logo_banner_sigmon.png" alt="SIGMON" width="300">
  <h1>SIGMON — Sistema Integrado de Gestão e Monitoramento</h1>
  <p>Gestão centralizada de câmeras de segurança e centrais de alarme</p>
</div>

Sistema web para gerenciamento de câmeras e centrais de alarme em ambientes
empresariais: equipamentos, manutenções, relatórios e geolocalização, com
autenticação hierárquica e API REST v2.

## Sumário

- [Visão geral](#visão-geral)
- [Requisitos](#requisitos)
- [Início rápido](#início-rápido)
- [Configuração](#configuração)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Roteamento](#roteamento)
- [API](#api)
- [Níveis de acesso](#níveis-de-acesso)
- [Segurança](#segurança)
- [Testes e qualidade](#testes-e-qualidade)
- [Migrations](#migrations)
- [Performance](#performance)
- [Documentação](#documentação)
- [Versão](#versão)

## Visão geral

| Área | Recursos |
| --- | --- |
| Câmeras | Cadastro, vínculo com locais/modelos/regiões, status de operação, histórico de manutenção com anexos, geolocalização e consulta de CEP, dashboard |
| Alarmes | Centrais de alarme, vínculo com locais/regiões/contas, status de monitoramento, integração com câmeras GM e DVRs, dashboard |
| Locais | Tipos (escola, CMEI, posto de saúde, próprio, operadora), regiões e secretarias, endereço completo, coordenadas, horário de funcionamento e alarme integrado |
| Usuários | Níveis `admin`, `supervisor` e `user`; ativação/bloqueio, redefinição por token e validação de força da senha |
| Manutenção | Registros de câmeras e alarmes, upload de fotos/documentos e filtros por data, tipo e status |
| Relatórios | Filtros avançados, auditoria de operações, dados geolocalizados e Relatório Diário de Turno |
| API v2 | Endpoints padronizados, sessão com controle por nível, rate limiting, validação de entrada, paginação e CORS configurável |

## Requisitos

- **PHP 8.5.12+** com extensões `pdo_mysql`, `apcu`, `openssl`, `mbstring`, `fileinfo`, `json`, `session`, `zip`
- **MySQL 8.4 LTS** ou **MariaDB 10.5+**
- **Composer 2.4+**
- **Node.js 22.11+, 24.11+ ou 26+** (ver `package.json`) para o build com Vite
- **Apache 2.4+** (com `mod_rewrite`) ou PHP built-in server
- Opcional: **Docker** com Compose (desenvolvimento e produção)

## Início rápido

### Docker (desenvolvimento)

```bash
docker compose up -d
docker compose logs -f app
docker compose down
```

Acesse `http://localhost:5000/`. O Apache e o MySQL usam `network_mode: host`
(MySQL na porta 3306). Antes do primeiro `up`, o compose exige o arquivo local
`config/DB/private/proprios-pml.sql` (não versionado) na pasta de dados
iniciais. Para o Vite dev server (`:3000`), o proxy `/api` já aponta para `:5000`.

### Instalação local

```bash
composer install
npm install && npm run build

# Configuração fora do projeto (Windows: C:\env\sigmon\.env)
sudo mkdir -p /etc/sigmon
sudo cp .env.example /etc/sigmon/.env
sudo chmod 700 /etc/sigmon && sudo chmod 600 /etc/sigmon/.env
# edite as credenciais em /etc/sigmon/.env

mysql -u root -p < config/DB/cftv_gml.sql
php -S localhost:8080 -t public/   # http://localhost:8080
```

Com Apache, aponte o VirtualHost para `public/`. O passo a passo completo,
incluindo Windows/XAMPP e solução de problemas, está em
[`docs/SETUP.md`](docs/SETUP.md). Para produção, veja
[`docs/DEPLOY.md`](docs/DEPLOY.md).

## Configuração

As configurações ficam em uma pasta externa ao projeto, fora do DocumentRoot:

- Linux: `/etc/sigmon/.env`
- Windows: `C:\env\sigmon\.env`

Variáveis principais (veja todas em [`.env.example`](.env.example)):

```env
SIGMON_ENV=development                  # development | testing | production
DB_HOST=localhost
DB_NAME=cftv_gml
DB_USER=seu_usuario
DB_PASS=sua_senha_forte
APP_TIMEZONE=America/Sao_Paulo
SIGMON_SESSION_TIMEOUT=3600
SIGMON_SESSION_ABSOLUTE_TIMEOUT=28800
SIGMON_CSP_ALLOW_INLINE_STYLES=0
PROXY_TRUSTED_IPS=
APP_ALLOWED_ORIGINS=
VITE_API_URL=http://localhost:5000
```

> Os prefixos `SIGMON_*` substituem os antigos `CAMERAS_*`. Por compatibilidade,
> os nomes antigos e o caminho `/etc/sistema-cameras/.env` ainda funcionam como
> fallback. Detalhes em [`docs/SECURITY_ENV.md`](docs/SECURITY_ENV.md).

## Estrutura do projeto

```text
sigmon/
├── accounts/       # Usuários (cadastro, edição, listagem, administracao)
├── api/            # Bootstrap e endpoints da API v2 (api/v2/)
├── auth/           # Login, logout e recuperação de senha
├── config/         # app.php, database.php, scripts SQL (config/DB/)
├── database/       # Runner de migrations (migrate.php)
├── dist/           # Saída do build do Vite
├── docs/           # Documentação (índice em docs/README.md)
├── inc/            # Segurança, sessão, layout, whitelist e acesso
├── public/         # DocumentRoot: index.php, assets, images, uploads
├── resources/      # Páginas e handlers (câmeras, alarmes, locais, etc.)
├── scripts/        # Backup, OPcache, assets e utilitários
├── src/            # Classes PHP (Api, Services, Validation) e fontes TS/CSS
├── storage/        # Cache CEP e rate limiting
├── tests/          # PHPUnit (Unit, Integration, Api) e Vitest (Js)
├── composer.json / package.json / vite.config.ts / phpunit.xml
```

## Roteamento

Toda requisição passa pelo front controller `public/index.php`:

| Tipo | Comportamento |
| --- | --- |
| `action` | Processa POST e retorna JSON/redirect, sem layout |
| `mixed` | Intercepta POST com `submit`; caso contrário renderiza com layout |
| `logout` | Limpa a sessão e redireciona |
| Página | Renderizada com header/footer via whitelist de páginas |
| API | Prefixo `api/` → bootstrap da API → JSON |
| 404 | Página fora da whitelist |

## API

Os endpoints são acionados via `index.php?page=api/<endpoint>` e retornam JSON
no formato padronizado:

```json
{"success": true, "code": "SUCCESS", "message": "...", "data": {}, "meta": {"timestamp": "...", "version": "v2", "request_id": "req_..."}}
```

| Grupo | Endpoints (sem o prefixo `api/`) |
| --- | --- |
| Câmeras | `api_cameras`, `api_cadastrar_cameras`, `api_editar_camera`, `api_excluir_camera`, `api_modelos_cameras`, `api_manutencao_cameras` |
| Anexos | `api_upload_anexo`, `api_listar_anexos`, `api_servir_anexo`, `api_excluir_anexo` |
| Alarmes | `api_alarmes`, `api_cadastrar_alarmes`, `api_editar_alarme`, `api_excluir_alarme`, `api_modelos_alarmes`, `api_manutencao_alarmes` |
| Auditoria e notificações | `api_auditoria_cameras`, `api_auditoria_alarmes`, `api_notificacoes` |
| Dashboard e relatórios | `api_dashboard`, `api_status`, `api_relatorios_cameras`, `api_relatorio_diario`, `api_exportar_locais` |
| Utilitários | `api_ping` (público), `api_health` (admin), `api_cep_lookup`, `api_geocode`, `api_locais` |
| Sessão | `session_check`, `renovar_sessao`, `limpar_sessoes_orfas` (admin) |
| Documentação viva | `api/v2/swagger`, `api/v2/swagger-spec` (admin) |

A especificação completa está em [`docs/openapi.yaml`](docs/openapi.yaml).
Autenticação por cookie de sessão e token CSRF (`X-CSRF-Token`) nas requisições
que não sejam GET.

## Níveis de acesso

| Nível | Descrição |
| --- | --- |
| `admin` | Acesso completo; gerencia usuários e health check |
| `supervisor` | Gerencia câmeras, alarmes, locais e manutenções |
| `user` | Visualização e operações básicas |

A hierarquia é cumulativa: `admin > supervisor > user`.

## Segurança

- Senhas com Argon2id e auto-rehash de bcrypt legado
- CSRF com token rotativo por sessão, sincronizado via interceptor de `fetch`
- Sessão única por usuário com binding de IP + User-Agent; cookies `HttpOnly`,
  `SameSite=Lax` e `Secure` sob HTTPS
- Rate limiting por IP e endpoint (login, API, upload, geocode)
- Prepared statements, `htmlspecialchars()` e CSP com nonce em produção
- Upload com validação MIME (`finfo`), whitelist e nomes hasheados; proteção
  contra path traversal via `realpath()`
- Headers de resposta: `nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` e HSTS
- `.env` obrigatoriamente fora do repositório

Em produção: defina `SIGMON_ENV=production`, ative HTTPS/HSTS e
`SIGMON_FORCE_HTTPS_SESSION=1`, mantenha `SIGMON_CSP_ALLOW_INLINE_STYLES=0`,
configure `APP_ALLOWED_ORIGINS`, habilite OPcache e faça backups diários
(`scripts/backup.sh` ou `backup.ps1`).
Contexto adicional: [`docs/SECURITY_REPORT.md`](docs/SECURITY_REPORT.md),
[`docs/ADR_SEGURANCA.md`](docs/ADR_SEGURANCA.md) e
[`docs/PROD_READINESS_REPORT.md`](docs/PROD_READINESS_REPORT.md).

## Testes e qualidade

```bash
vendor/bin/phpunit                 # suíte PHPUnit
vendor/bin/phpunit tests/Unit/     # testes unitários
vendor/bin/phpunit tests/Api/      # requer servidor HTTP no ar
vendor/bin/phpstan analyse         # análise estática (nível 5)
npm test                           # Vitest
php scripts/check-opcache.php      # smoke test de OPcache
```

Skips podem ocorrer quando o servidor HTTP de teste ou o MySQL de teste não
está disponível; não indicam regressão. Detalhes em
[`docs/TESTS_REPORT.md`](docs/TESTS_REPORT.md) e
[`docs/QUALITY_REPORT.md`](docs/QUALITY_REPORT.md).

## Migrations

```bash
php database/migrate.php --status   # aplicadas e pendentes
php database/migrate.php            # aplica pendentes
php database/migrate.php --down 1   # rollback da última migration
```

Uma base nova importada de `config/DB/cftv_gml.sql` já contém as migrations
consolidadas registradas; não é necessário rodar o runner na primeira
instalação. Novos arquivos seguem o formato
`YYYY_MM_DD_HHMMSS_description.php` em `database/migrations/`.

## Performance

O sistema passou por três tiers de otimização (cache APCu, `Cache-Control`/ETag,
índices de banco, compressão Brotli/gzip e Font Awesome self-hosted). O
diagnóstico completo e a lista de alterações estão em
[`docs/concluidos/Relatorio_Performance.md`](docs/concluidos/Relatorio_Performance.md)
e [`docs/PERFORMANCE_REPORT.md`](docs/PERFORMANCE_REPORT.md).

## Documentação

O índice completo, com guias, auditorias, planos e documentos históricos, está
em [`docs/README.md`](docs/README.md).

## Versão

**v1.0.0** (ver [`VERSION`](VERSION)) — licença proprietária.
