# Manual de Migração e Desativação do SIGMON

Procedimento para **trocar de servidor** e, depois, **apagar todo o sistema no servidor antigo**.

> **Regra de ouro:** não delete nada no servidor antigo antes de o novo estar validado
> e os backups estarem copiados para fora do servidor antigo.

---

## 1. Visão geral do ambiente

| Item | Onde fica | Observação |
|------|-----------|------------|
| Projeto/compose | `sigmon` | Prefixo de containers, redes e volumes |
| Containers | `sigmon-db-1`, `sigmon-app-1` | Docker Compose |
| Banco de dados | bind mount `${DB_DATA_PATH:-/mnt/sstv-dados/mysql}` | **Não** é volume nomeado |
| Uploads/anexos | volume nomeado `sigmon_app_uploads` | Dados que precisam de backup |
| Storage (`ratelimit`, `cep_cache`) | volume nomeado `sigmon_app_storage` | Cache; não precisa migrar |
| Certificados TLS | volume nomeado `sigmon_nginx_certs` | Só relevante se `SIGMON_HTTP_ONLY=0` |
| Imagem da aplicação | `ghcr.io/defesatecnologia-lang/sigmon:${APP_TAG}` | Build ocorre no GitHub Actions |
| Configuração | `.env` | Não versionado; contém segredos |
| Versão implantada | `DEPLOYED_VERSION` | Gerado pelo `deploy.sh` |

Caminho de referência do código no servidor: `/opt/sistemas/sigmon`.

**Ordem correta da migração:**

```
Backup no antigo → Preparar novo → Restaurar → Validar → Apontar acessos → Só então destruir o antigo
```

---

## 2. Antes de começar (checklist)

- [ ] Janela de manutenção comunicada aos usuários.
- [ ] Acesso SSH ao servidor antigo e ao novo.
- [ ] Acesso ao GHCR (se a imagem for privada): PAT com `read:packages`.
- [ ] Novo servidor com Docker instalado e disco de dados montado.
- [ ] Espaço em disco suficiente para backups no antigo e no novo.
- [ ] Confirmar que a versão desejada está na `main` e a imagem publicada no GHCR
      (o servidor **só faz deploy a partir da `main`**).
- [ ] Ter um destino externo (NAS/HD) para guardar os backups.

---

## 3. Fase 1 — Backup no servidor antigo

Execute com o app parado para congelar as escritas. O banco continua de pé para o dump.

```bash
cd /opt/sistemas/sigmon
mkdir -p /opt/backups/migracao

# Congela escritas da aplicação
docker compose -f docker-compose.prod.yml stop app

# 1) Dump lógico do banco
docker compose -f docker-compose.prod.yml exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --quick \
   --routines --triggers --events -u"${MYSQL_USER:-root}" "${MYSQL_DATABASE:-cftv_gml}"' \
  | gzip > /opt/backups/migracao/sigmon-db.sql.gz

# 2) Uploads/anexos (funciona mesmo com o app parado)
docker run --rm -v sigmon_app_uploads:/data -v /opt/backups/migracao:/backup \
  alpine tar czf /backup/sigmon-uploads.tgz -C /data .

# 3) Configuração e versão implantada
cp .env DEPLOYED_VERSION /opt/backups/migracao/

# 4) Validar o dump
gzip -t /opt/backups/migracao/sigmon-db.sql.gz && echo "DB OK"
ls -lh /opt/backups/migracao/
```

### 3.1 Backup opcional do datadir físico do MySQL (recomendado)

Cópia "a frio" do diretório de dados, como segunda linha de defesa:

```bash
docker compose -f docker-compose.prod.yml stop db
tar czf /opt/backups/migracao/sigmon-mysql-datadir.tgz -C /mnt/sstv-dados mysql
docker compose -f docker-compose.prod.yml start db
```

### 3.2 Copiar os backups para fora do servidor antigo

```bash
# Para o servidor novo
scp /opt/backups/migracao/* usuario@NOVO_IP:/opt/backups/migracao/

# E para um local externo (NAS/HD) — obrigatório
```

> Sempre confira o tamanho e o `gzip -t` antes de considerar o backup válido.

---

## 4. Fase 2 — Preparar o servidor novo

```bash
# 1) Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"     # relogar depois

# 2) Diretórios
sudo mkdir -p /opt/sistemas /mnt/sstv-dados/mysql
sudo chown "$USER:$USER" /opt/sistemas
sudo chown -R 999:999 /mnt/sstv-dados/mysql    # UID do mysql no container

# 3) Código (branch main)
git clone git@github.com:defesatecnologia-lang/SIGMON.git /opt/sistemas/sigmon
cd /opt/sistemas/sigmon
git checkout main

# 4) Configuração
cp .env.prod.example .env
nano .env
```

### 4.1 Variáveis do `.env` que precisam de atenção

```bash
DB_ROOT_PASSWORD=...            # senha root do MySQL
DB_PASS=...                     # senha do usuário da aplicação
DB_NAME=cftv_gml
DB_USER=cftv_user
DB_DATA_PATH=/mnt/sstv-dados/mysql

SIGMON_HTTP_ONLY=1
APP_PORT=3000
APP_ALLOWED_ORIGINS=http://NOVO_IP:3000   # <-- atualizar para o novo endereço

APP_TAG=latest
GITHUB_REPOSITORY=defesatecnologia-lang/sigmon
```

> Se `/mnt/sstv-dados` é disco/RAID, garanta a montagem no `/etc/fstab` **antes**
> de subir o banco. Caso contrário os dados vão para o disco raiz.

### 4.2 Acesso ao GHCR (somente se a imagem for privada)

```bash
echo "$CR_PAT" | docker login ghcr.io -u SEU_USUARIO --password-stdin
```

---

## 5. Fase 3 — Restaurar no servidor novo

```bash
cd /opt/sistemas/sigmon
: > DEPLOYED_VERSION

# 1) Sobe SOMENTE o banco.
#    No primeiro boot (datadir vazio) ele cria a base e importa config/DB/cftv_gml.sql
docker compose -f docker-compose.prod.yml up -d db
docker compose -f docker-compose.prod.yml ps      # aguarde "healthy"

# 2) Restaura o dump como root
#    (evita falha de DEFINER em triggers/views/procedures)
gunzip -c /opt/backups/migracao/sigmon-db.sql.gz | \
docker compose -f docker-compose.prod.yml exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "${MYSQL_DATABASE:-cftv_gml}"'

# 3) Sobe a aplicação (imagem do GHCR; nada é buildado no servidor)
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d --no-build

# 4) Restaura os uploads e corrige o dono (www-data = 33:33)
docker run --rm -i -v sigmon_app_uploads:/data alpine \
  tar xzf - -C /data < /opt/backups/migracao/sigmon-uploads.tgz
docker run --rm -v sigmon_app_uploads:/data alpine chown -R 33:33 /data
```

### 5.1 Alternativa: deploy pelo script padrão

Depois de o banco estar restaurado:

```bash
cd /opt/sistemas/sigmon
git fetch origin && git reset --hard origin/main
./scripts/server/deploy.sh
cat DEPLOYED_VERSION
```

O script baixa a imagem, recria o `app` se necessário, aguarda o healthcheck e grava a versão.

---

## 6. Fase 4 — Validar antes de desligar o antigo

### 6.1 Verificações automáticas

```bash
cd /opt/sistemas/sigmon

docker compose -f docker-compose.prod.yml ps          # db e app "healthy"
curl -fsS http://localhost:3000/ >/dev/null && echo "HTTP_OK"
cat DEPLOYED_VERSION

# Compare as contagens com as do servidor antigo
docker compose -f docker-compose.prod.yml exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"${MYSQL_USER}" "$MYSQL_DATABASE" \
   -e "SELECT COUNT(*) AS locais FROM locais; \
       SELECT COUNT(*) AS equipamentos FROM equipamentos;"'
```

### 6.2 Verificações manuais no navegador

- [ ] Login funcionando (admin e supervisor).
- [ ] Listagem de **locais** carregando todos os registros.
- [ ] Listagens de câmeras, alarmes e relatórios.
- [ ] Dashboard carregando dados.
- [ ] Abrir um anexo/foto de manutenção (valida os uploads).
- [ ] Cadastro/edição de um registro de teste (e depois remover).
- [ ] Rodapé exibindo a versão implantada.

**Somente avance se tudo estiver OK.**

---

## 7. Fase 5 — Apontar acessos para o servidor novo

- [ ] Atualizar `APP_ALLOWED_ORIGINS` para o novo endereço e recriar o app:
      `docker compose -f docker-compose.prod.yml up -d --no-build --force-recreate app`
- [ ] Liberar no firewall do novo servidor a porta `APP_PORT` (e `443` se usar HTTPS).
- [ ] Atualizar bookmarks, atalhos e documentação para `http://NOVO_IP:3000`.
- [ ] Se houver proxy reverso/load balancer, apontar para o novo IP e ajustar `PROXY_TRUSTED_IPS`.
- [ ] Se usar TLS com CA interna, copiar os certificados para o volume `nginx_certs`:
      ```bash
      docker cp server.crt sigmon-app-1:/etc/nginx/certs/server.crt
      docker cp server.key sigmon-app-1:/etc/nginx/certs/server.key
      docker compose -f docker-compose.prod.yml restart app
      ```
- [ ] Atualizar monitoramento/alertas para o novo IP.

---

## 8. Fase 6 — Desativar e excluir o sistema no servidor antigo

> **Pré-requisito:** Fase 4 validada e backups copiados para fora do servidor antigo.

```bash
cd /opt/sistemas/sigmon

# 1) Para e remove containers, redes e volumes nomeados
#    (uploads/storage/certs). O datadir do MySQL é bind mount e permanece.
docker compose -f docker-compose.prod.yml down -v

# 2) Remove imagens baixadas (opcional)
docker image prune -a -f

# 3) Remove código, configuração e backups locais
sudo rm -rf /opt/sistemas/sigmon
sudo rm -rf /opt/backups/migracao

# 4) Remove os dados do MySQL no disco
#    CONFIRME que o backup está fora deste servidor antes de rodar!
sudo rm -rf /mnt/sstv-dados/mysql

# 5) Remove cron de backup, se existir
crontab -l     # procure scripts/backup.sh
crontab -e

# 6) Remove credenciais e chaves do servidor
docker logout ghcr.io
# revogar/remover chaves em ~/.ssh usadas para deploy
```

### 8.1 Se a máquina for descartada/reformatada

```bash
sudo systemctl stop docker
sudo apt-get purge -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo rm -rf /var/lib/docker /var/lib/containerd /etc/docker
```

### 8.2 Limpeza de infraestrutura (não esqueça)

- [ ] Regras de firewall/NAT do IP antigo.
- [ ] DNS / inventário / documentação interna.
- [ ] Acessos SSH do usuário no servidor antigo.
- [ ] Monitoramento e backup agendado apontando para o IP antigo.
- [ ] Chaves de deploy e tokens do GHCR associados ao servidor antigo.

---

## 9. Rollback (se algo falhar após o corte)

O servidor antigo deve continuar intacto até a validação final. Se o novo falhar:

1. **Não** delete o antigo.
2. Reaponte os acessos para o IP antigo.
3. Suba o antigo novamente:
   ```bash
   cd /opt/sistemas/sigmon
   docker compose -f docker-compose.prod.yml up -d
   ```
4. Investigue os logs do novo:
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail=100 app
   docker compose -f docker-compose.prod.yml logs --tail=100 db
   ```

---

## 10. Armadilhas comuns

| Risco | Prevenção |
|-------|-----------|
| `down -v` antes do backup | Sempre execute a Fase 1 primeiro |
| Banco "vazio" no novo servidor | Suba o `db` com datadir vazio (cria schema) e só depois restaure o dump |
| Anexos 404 | Restaurar `sigmon_app_uploads` e aplicar `chown 33:33` |
| Erro de DEFINER/trigger no restore | Restaurar como `root`, não como `cftv_user` |
| Dados no disco errado | Montar `/mnt/sstv-dados` no `fstab` e `chown 999:999` antes do `up` |
| Versão antiga no rodapé | Garantir merge na `main` e imagem publicada no GHCR |
| Container unhealthy | Ver `docker compose logs --tail=100 app` |
| Segredos expostos | `.env` apenas por `scp`/cofre; nunca no Git |
| Perda definitiva | Manter os backups em local externo até a validação final |

---

## 11. Comandos de referência rápida

```bash
# Subir tudo
docker compose -f docker-compose.prod.yml up -d --no-build

# Parar tudo (mantém volumes e dados)
docker compose -f docker-compose.prod.yml stop

# Parar e remover containers/redes/volumes nomeados
docker compose -f docker-compose.prod.yml down -v

# Status e logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db

# Backup manual padrão do projeto
./scripts/backup.sh
# Variáveis: COMPOSE_FILE, BACKUP_DIR, RETENTION_DAYS

# Deploy/atualização (a partir da main)
git fetch origin && git reset --hard origin/main
./scripts/server/deploy.sh
```
