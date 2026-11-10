# Лабораторна робота №3
## Тема: Створення Telegram-боту з меню та запитом до AI

---

## 📋 Опис завдання

Розробити Telegram-бот з меню та взаємодією зі штучним інтелектом:
1. **Головне меню боту**:
   - `Student` — виведення ПІБ студента та групи (наприклад, `ст. Вівдиченко М. С. гр. ІП-34`).
   - `IT-technologies` — перелік використовуваних технологій (Front-end, Back-end, бази даних тощо).
   - `Contacts` — контактні дані (телефон, e-mail).
   - `Prompt AI` — текстовий запит до штучного інтелекту (Google Gemini).
2. **Кнопка «Назад»**:
   - При виборі будь-якого пункту меню з'являється кнопка `Назад`, яка повертає користувача до головного меню.
3. **Запит до AI**:
   - При натисканні `Prompt AI` або надсиланні текстового повідомлення бот робить запит до AI через функцію `ask_gemini()`.

---

## 🗂 Структура проєкту

```text
Lab-3/
├── bot.py             # Головний файл ініціалізації та запуску бота (python-telegram-bot)
├── main.py            # Додаткова точка входу (alias для запуску bot.py)
├── gemini_service.py  # 👈 ТУТ ФУНКЦІЯ ask_gemini ДЛЯ ВСТАВКИ ВАШОГО КОДУ GEMINI
├── handlers.py        # Обробники команд (/start, /help) та натискань кнопок меню
├── keyboards.py       # Клавіатури Telegram (головне меню та кнопка "Назад")
├── config.py          # Конфігурація та зчитування змінних з .env
├── requirements.txt   # Залежності проєкту (python-telegram-bot, google-genai тощо)
├── .env.example       # Шаблон змінних оточення
├── .env               # Файл з вашими токенами (не комітиться в git)
└── README.md          # Інструкція до виконання
```

---

## ⚙️ Налаштування та запуск

### 1. Встановлення залежностей

Переконайтеся, що встановлено Python 3.10+ та виконайте:

```bash
pip install -r requirements.txt
```

### 2. Отримання токенів

1. **Telegram Bot Token**:
   - Відкрийте бота [@BotFather](https://t.me/BotFather) у Telegram.
   - Надішліть команду `/newbot` та виконайте кроки для створення нового бота.
   - Скопіюйте отриманий токен (формат: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`).
2. **Google Gemini API Key**:
   - Перейдіть на [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Створіть новий API ключ (Get API Key).

### 3. Налаштування файлу `.env`

Відкрийте файл `Lab-3/.env` та вкажіть ваші дані:

```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
GEMINI_API_KEY=AIzaSyD-your-gemini-api-key-here

STUDENT_LAST_NAME=Вівдиченко
STUDENT_INITIALS=М. С.
STUDENT_GROUP=ІП-34
STUDENT_VARIANT=9
```

---

## 🤖 Куди вставити код взаємодії з Gemini

Відкрийте файл `gemini_service.py`. У ньому знаходиться асинхронна функція:

```python
async def ask_gemini(prompt: str) -> str:
    # TODO: ВСТАВТЕ ВАШ КОД ВЗАЄМОДІЇ З GEMINI ТУТ
```

### Приклад 1: Використання офіційної бібліотеки `google-genai` (вже встановлена)
```python
from google import genai
from config import GEMINI_API_KEY

async def ask_gemini(prompt: str) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )
    return response.text
```

### Приклад 2: Прямий асинхронний REST-запит через `httpx`
```python
import httpx
from config import GEMINI_API_KEY

async def ask_gemini(prompt: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, timeout=30.0)
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
```

---

## 🚀 Запуск бота

Для запуску виконайте в терміналі:

```bash
python bot.py
```
*(або `python main.py`)*

Перейдіть у Telegram до вашого бота і надішліть команду `/start`.

---

## ☁️ Деплой на безкоштовні платформи (згідно з методичкою)

У методичних вказівках пропонується деплой на сервіси, такі як **PythonAnywhere**, **Render**, **Glitch** або **AWS**:

### Варіант: PythonAnywhere
1. Зареєструйтесь на [PythonAnywhere](https://www.pythonanywhere.com/).
2. Перейдіть у вкладку **Consoles** -> **Bash**.
3. Завантажте файли або клонуйте репозиторій:
   ```bash
   git clone <посилання_на_ваш_репозиторій>
   cd WEB/Lab-3
   ```
4. Встановіть залежності:
   ```bash
   pip install --user -r requirements.txt
   ```
5. Створіть файл `.env` з токенами:
   ```bash
   nano .env
   ```
6. Запустіть бота:
   ```bash
   python3 bot.py
   ```
*(Для постійної роботи у фоні на PythonAnywhere можна використати вкладку **Tasks** -> Scheduled / Always-on task).*
