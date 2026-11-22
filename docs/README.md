# Documentação — SIGMON

Índice da documentação versionada. O [`README.md`](../README.md) da raiz é a
porta de entrada do projeto; aqui ficam os documentos de apoio.

> **Como ler:** guias e referências descrevem o estado atual do sistema.
> Auditorias e planos são **snapshots datados** — registram o que era verdade
> na data indicada no cabeçalho, não necessariamente o estado de hoje.
> Relatórios concluídos são arquivados em [`concluidos/`](concluidos/README.md).

## Guias e referência

| Documento | Conteúdo |
| --- | --- |
| [SETUP.md](SETUP.md) | Instalação em Linux/Windows, caminhos do `.env`, dependências, banco, solução de problemas |
| [DEPLOY.md](DEPLOY.md) | CD via GitHub Actions, Docker Compose de produção, TLS, atualização manual no servidor |
| [SECURITY_ENV.md](SECURITY_ENV.md) | Cuidados com credenciais e com o arquivo `.env` fora do repositório |
| [openapi.yaml](openapi.yaml) | Especificação OpenAPI 3.0 da API v2 (usada pela UI Swagger) |
| [tests/README.md](../tests/README.md) | Smoke tests de segurança/sessão |
| [public/README.md](../public/README.md) | Configuração do DocumentRoot e do cache de assets estáticos |

## Decisões, especificações e escopo

| Documento | Conteúdo |
| --- | --- |
| [ADR_SEGURANCA.md](ADR_SEGURANCA.md) | Decisões sobre os achados F-102 a F-104 (2026-09-11) |
| [ESPECIFICACAO-FINAL.md](ESPECIFICACAO-FINAL.md) | Protocolo de auditoria completa em fases, com critérios e evidências |
| [Relatorios/ESPECIFICACAO-AUDITORIA-PHP.md](Relatorios/ESPECIFICACAO-AUDITORIA-PHP.md) | Especificação de auditoria para projetos PHP |
| [Relatorios/ESPECIFICAÇÃO-TECNICA-SEGURANÇA-PHP.md](Relatorios/ESPECIFICAÇÃO-TECNICA-SEGURANÇA-PHP.md) | Baseline de segurança para aplicações PHP/MySQL/Docker |
| [Relatorios/ESPECIFICACAO_SEGURANCA_DOCKER_HOST_v1.0.md](Relatorios/ESPECIFICACAO_SEGURANCA_DOCKER_HOST_v1.0.md) | Hardening de hosts Linux e containers Docker |
| [Relatorios/criacao-relatorio-diario.md](Relatorios/criacao-relatorio-diario.md) | Escopo funcional do Relatório Diário de Turno |

## Auditorias — snapshot de 2026-08-16

| Documento | Abrangência |
| --- | --- |
| [DISCOVERY.md](DISCOVERY.md) | Levantamento inicial do estado do sistema (fase 0) |
| [AUDIT_MATRIX.md](AUDIT_MATRIX.md) | Matriz de controles auditados e resultados (OK / FALHA / NA) |
| [SECURITY_REPORT.md](SECURITY_REPORT.md) | Segurança de código (OWASP/ASVS/CWE) |
| [DATABASE_REPORT.md](DATABASE_REPORT.md) | Schema, índices, constraints e migrações |
| [DEVOPS_REPORT.md](DEVOPS_REPORT.md) | Dockerfiles, Compose, Nginx e CI/CD |
| [DEPENDENCIES_REPORT.md](DEPENDENCIES_REPORT.md) | Auditorias de dependências PHP e Node |
| [QUALITY_REPORT.md](QUALITY_REPORT.md) | PSR-12, PHPStan, duplicação e código morto |
| [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) | Queries, cache, paginação e entrega de assets |
| [TESTS_REPORT.md](TESTS_REPORT.md) | Suítes PHPUnit/Vitest, cobertura e lacunas |
| [DOCUMENTATION_REPORT.md](DOCUMENTATION_REPORT.md) | Divergências entre documentação e código |
| [CONSOLIDATION_REPORT.md](CONSOLIDATION_REPORT.md) | Consolidação dos achados F-001 a F-807 |

## Planos e acompanhamento

| Documento | Conteúdo |
| --- | --- |
| [PROD_READINESS_REPORT.md](PROD_READINESS_REPORT.md) | Veredito de prontidão para produção e bloqueadores (2026-09-11) |
| [PLANO_EXECUCAO_PRODUCAO.md](PLANO_EXECUCAO_PRODUCAO.md) | Fases P0/P1/P2 para o go-live (2026-09-11) |
| [Plano_Correcoes_Atualizado.md](Plano_Correcoes_Atualizado.md) | Status dos findings de segurança, auditoria e refatoração |
| [REFACTORING_PLAN.md](REFACTORING_PLAN.md) | Plano de refatoração (fase 14 do protocolo) |

## Histórico

Documentos já executados, mantidos apenas como referência. O índice da pasta
está em [concluidos/README.md](concluidos/README.md).

- [Backlog_Arquitetural.md](concluidos/Backlog_Arquitetural.md) — roadmap de longo prazo
- [Codigo_Morto_Encontrado.md](concluidos/Codigo_Morto_Encontrado.md) e [Codigo_Morto_Executado.md](concluidos/Codigo_Morto_Executado.md) — diagnóstico e remoção
- [Relatorio_Performance.md](concluidos/Relatorio_Performance.md) — otimizações dos tiers 1 a 3
- [Relatorio_Auditoria_Final.md](concluidos/Auditoria/Relatorio_Auditoria_Final.md) — auditoria técnica das sprints 0 a 3
- [Avaliacao_Risco_Sprints0-3.md](concluidos/Auditoria/Avaliacao_Risco_Sprints0-3.md) — avaliação de risco pós-implementação

## Mantendo este índice

- Novos guias devem ser criados em `docs/` e adicionados a uma das tabelas acima.
- Ao finalizar um relatório, mova-o para `docs/concluidos/` e atualize as
  referências a ele (`README.md`, este índice e documentos que o citam).
- Auditorias e planos devem manter a data no cabeçalho para deixar claro que
  são um registro histórico.
