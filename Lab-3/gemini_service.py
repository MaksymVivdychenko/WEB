import logging
from google import genai
from google.genai import types
from config import GEMINI_API_KEY

logger = logging.getLogger(__name__)

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


async def ask_gemini(prompt: str) -> str:
    global client

    if not GEMINI_API_KEY or GEMINI_API_KEY.startswith("YOUR_GEMINI"):
        return (
            "Вибачте, сталася помилка. Виконайте спробу пізніше"
        )

    if client is None:
        client = genai.Client(api_key=GEMINI_API_KEY)

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=4096,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                system_instruction=(
                    "Ти ввічливий помічник у Telegram-боті. Відповідай вичерпно, "
                    "структуровано та українською мовою. Пам'ятай, що в телеграмі "
                    "немає markdown формату, тому використовуй емодзі та прості відступи."
                ),
            ),
        )

        # Збираємо всі частини тексту докупи (якщо відповідь розділена на кілька parts)
        full_text = ""
        if response.candidates:
            for candidate in response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if getattr(part, "text", None):
                            full_text += part.text

        if full_text.strip():
            return full_text
        elif response.text:
            return response.text
        else:
            return "🤖 Модель повернула порожню відповідь (можливо, запит заблоковано фільтрами безпеки)."

    except Exception as exc:
        logger.exception("Помилка під час виклику client.aio.models.generate_content: %s", exc)
        return f"⚠️ Помилка Gemini API: {exc}"
