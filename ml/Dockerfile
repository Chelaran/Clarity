FROM python:3.9-slim

WORKDIR /app

# Копируем необходимые файлы
COPY models/ ./models/
COPY api.py .
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "5000"]

