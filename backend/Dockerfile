FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

RUN apt-get update && \
    apt-get install -y netcat-traditional && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /app/

RUN chmod +x /app/entrypoint.sh && \
    sed -i 's/\r$//g' /app/entrypoint.sh

COPY . /app/

RUN chmod -R 755 /app

ENTRYPOINT ["/app/entrypoint.sh"]