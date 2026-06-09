FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev

COPY app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app /app

COPY app/start.sh /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]