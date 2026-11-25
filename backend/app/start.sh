#!/bin/sh
set -e

# O docker-compose só inicia este contêiner depois que o banco responde (healthcheck).
echo "Preparando banco e criando Admin padrão (se necessário)..."
python seed.py

echo "Iniciando API..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
