#!/bin/sh

echo "Aguardando banco..."
sleep 10

echo "Criando coordenador padrão..."
python seed.py

echo "Iniciando API..."
uvicorn main:app --host 0.0.0.0 --port 8000