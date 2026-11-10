import os
from pathlib import Path
from dotenv import load_dotenv

# Базова директорія проєкту
BASE_DIR = Path(__file__).resolve().parent

# Завантаження змінних оточення з .env файлу
load_dotenv(BASE_DIR / ".env")

# Токен Telegram-бота (отримати у @BotFather)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Ключ API для Gemini (отримати на https://aistudio.google.com/)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Інформація про студента (згідно з методичними вказівками та Lab-2)
STUDENT_LAST_NAME = os.getenv("STUDENT_LAST_NAME", "Вівдиченко")
STUDENT_INITIALS = os.getenv("STUDENT_INITIALS", "М. С.")
STUDENT_GROUP = os.getenv("STUDENT_GROUP", "ІП-34")
STUDENT_VARIANT = int(os.getenv("STUDENT_VARIANT", "9"))

# Контактні дані
STUDENT_PHONE = os.getenv("STUDENT_PHONE", "+380 (50) 123-45-67")
STUDENT_EMAIL = os.getenv("STUDENT_EMAIL", "maksym.vivdychenko@gmail.com")

# Опис IT-технологій
IT_TECHNOLOGIES_TEXT = os.getenv(
    "IT_TECHNOLOGIES_TEXT",
    "IT-технології: Front-end\n"
    "Back-end WEB-технології\n\n"
    "• Мови програмування: Python, JavaScript, TypeScript\n"
    "• Back-end розробка: NestJS, FastAPI, Express.js, Node.js\n"
    "• Бази даних: MongoDB, PostgreSQL, Redis, SQLite\n"
    "• Web-технології: WebSocket, REST API, JWT, HTML5/CSS3\n"
    "• DevOps & Containerization: Docker, Docker Compose, Git\n"
    "• AI/LLM інтеграції: Google Gemini API, Model Context Protocol (MCP)"
)
