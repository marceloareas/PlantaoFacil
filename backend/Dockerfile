FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y build-essential libpq-dev

# Copia requirements e instala dependências Python
COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY app /app

# Expõe a porta padrão do FastAPI
EXPOSE 8000

# Comando padrão: iniciar servidor com hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
