FROM python:3.13-slim

# Запобігає буферизації логів (щоб вони відразу відображалися в Azure Portal/CLI)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Спочатку копіюємо залежності для кешування Docker шарів
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Копіюємо вихідний код проєкту
COPY . .

# Запуск Telegram-бота
CMD ["python", "bot.py"]
