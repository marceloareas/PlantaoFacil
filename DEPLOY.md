# Implantação do Plantão Fácil (branch Homologacao)

Este guia coloca o sistema no ar em uma máquina nova (ex.: servidor do CEFET), do zero, usando Docker.

## Como a aplicação fica organizada

| Contêiner | Imagem | Função | Porta |
|---|---|---|---|
| `plantaofacil-frontend` | nginx (build do React) | Entrega o site e repassa `/api/` para o backend | `HTTP_PORT` (padrão **80**) exposta no servidor |
| `plantaofacil-backend` | python:3.11-slim | API FastAPI (`/api/v1`) | 8000, só na rede interna do Docker |
| `plantaofacil-db` | postgres:16 | Banco de dados | 5432, só na rede interna do Docker |

Os dados do banco ficam no volume Docker `plantaofacil-homologacao_postgres_data` e sobrevivem a reinícios e atualizações.

## 1. Requisitos do servidor

- Linux (Ubuntu/Debian ou similar) com acesso à internet para baixar as imagens
- Docker Engine + plugin Docker Compose
- Git
- Porta HTTP liberada no firewall (padrão 80)

Instalação do Docker (Ubuntu/Debian), se ainda não houver:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # depois saia e entre de novo na sessão
docker --version
docker compose version
```

## 2. Baixar o código

```bash
git clone https://github.com/marceloareas/PlantaoFacil.git
cd PlantaoFacil
git checkout Homologacao
```

## 3. Configurar o ambiente

```bash
cp .env.example .env
nano .env
```

Preencha pelo menos:

- `POSTGRES_PASSWORD`: senha do banco (sem `@ : / ? #`)
- `JWT_SECRET`: chave longa e aleatória (ex.: saída de `openssl rand -hex 32`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: conta Admin criada na primeira inicialização
- `HTTP_PORT`: porta do site (80, ou outra se a 80 já estiver em uso no servidor)

O `.env` não vai para o Git (está no `.gitignore`).

## 4. Subir o sistema

```bash
docker compose up -d --build
```

O primeiro build demora alguns minutos (instala as dependências e gera o React).

Conferir:

```bash
docker compose ps                 # os 3 contêineres devem estar "running" (db como "healthy")
docker compose logs -f backend    # deve mostrar "Admin criado com sucesso." e o uvicorn iniciado
```

## 5. Primeiro acesso

- Sistema: `http://ENDERECO_DO_SERVIDOR` (ou `http://ENDERECO_DO_SERVIDOR:HTTP_PORT`)
- Teste da API: `http://ENDERECO_DO_SERVIDOR/api/v1/status`
- Documentação da API (Swagger): `http://ENDERECO_DO_SERVIDOR/docs`

Entre com o `ADMIN_EMAIL` e o `ADMIN_PASSWORD` do `.env`. Na primeira inicialização, o sistema também cria o setor padrão "Geral".

## 6. Operação do dia a dia

| Ação | Comando |
|---|---|
| Ver estado | `docker compose ps` |
| Ver logs | `docker compose logs -f backend` (ou `frontend`, `db`) |
| Reiniciar | `docker compose restart` |
| Parar | `docker compose down` (os dados continuam no volume) |
| Atualizar a versão | `git pull` e depois `docker compose up -d --build` |

Se alterar o `.env`, rode `docker compose up -d` de novo para aplicar.

## 7. Backup e restauração do banco

Para gerar um backup:

```bash
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > backup_$(date +%F).sql
```

Para restaurar (num banco vazio ou recém-criado):

```bash
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < backup_AAAA-MM-DD.sql
```

## 8. Apagar tudo e começar de novo

Este comando **apaga todos os dados do banco**:

```bash
docker compose down -v
docker compose up -d --build
```

## Problemas comuns

- **"Sem Conexão com o Banco" na página inicial**: veja `docker compose logs backend`. Normalmente é a senha do `.env` diferente da usada quando o volume do banco foi criado. Nesse caso, volte a senha antiga ou recrie o banco (seção 8).
- **Porta 80 em uso**: troque `HTTP_PORT` no `.env` (ex.: 8080) e rode `docker compose up -d`.
- **Mudou o `ADMIN_PASSWORD` depois da primeira subida**: a senha não muda. O Admin só é criado quando ainda não existe nenhum Admin ativo.

## Diferenças em relação ao ambiente de desenvolvimento

- O frontend roda como build de produção servido pelo nginx, e não mais com `npm start`. Alterações no código exigem `docker compose up -d --build`.
- O código não é montado como volume nos contêineres.
- Backend e banco não ficam expostos para fora do servidor. Só a porta do site fica aberta.
- O navegador acessa a API pelo mesmo endereço do site (`/api/v1`), então não é preciso configurar CORS nem `REACT_APP_API_URL`.
