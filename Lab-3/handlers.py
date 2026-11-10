import logging
from telegram import Update
from telegram.constants import ChatAction
from telegram.ext import ContextTypes

from config import (
    STUDENT_LAST_NAME,
    STUDENT_INITIALS,
    STUDENT_GROUP,
    STUDENT_VARIANT,
    STUDENT_PHONE,
    STUDENT_EMAIL,
    IT_TECHNOLOGIES_TEXT,
)
from keyboards import (
    BTN_STUDENT,
    BTN_IT_TECH,
    BTN_CONTACTS,
    BTN_PROMPT_AI,
    BTN_BACK,
    get_main_menu_keyboard,
    get_back_keyboard,
)
from gemini_service import ask_gemini

logger = logging.getLogger(__name__)

WELCOME_TEXT = "Вас вітає чат-бот! Виберіть відповідну команду"


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return

    context.user_data["waiting_for_ai_prompt"] = False

    await update.message.reply_text(
        text=WELCOME_TEXT,
        reply_markup=get_main_menu_keyboard(),
    )


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None:
        return

    help_text = (
        "ℹ️ **Довідка по боту:**\n\n"
        "• **Student** — інформація про студента (ПІБ, група)\n"
        "• **IT-technologies** — інформація про технології розробки\n"
        "• **Contacts** — контактні дані (телефон, email)\n"
        "• **Prompt AI** — надіслати текстовий запит до штучного інтелекту Gemini\n"
        "• **Назад** — повернення до головного меню"
    )
    await update.message.reply_text(
        text=help_text,
        parse_mode="Markdown",
        reply_markup=get_main_menu_keyboard(),
    )


async def text_message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.message is None or not update.message.text:
        return

    text = update.message.text.strip()
    chat_id = update.effective_chat.id
    text_lower = text.lower()

    # 1. Обробка кнопки "Student"
    if text == BTN_STUDENT:
        context.user_data["waiting_for_ai_prompt"] = False
        response = (
            f"ст. {STUDENT_LAST_NAME} {STUDENT_INITIALS} гр. {STUDENT_GROUP}\n"
            f"Варіант №{STUDENT_VARIANT}"
        )
        await update.message.reply_text(
            text=response,
            reply_markup=get_back_keyboard(),
        )
        return

    # 2. Обробка кнопки "IT-technologies"
    if (
        text == BTN_IT_TECH
    ):
        context.user_data["waiting_for_ai_prompt"] = False
        await update.message.reply_text(
            text=IT_TECHNOLOGIES_TEXT,
            reply_markup=get_back_keyboard(),
        )
        return

    # 3. Обробка кнопки "Contacts"
    if text == BTN_CONTACTS:
        context.user_data["waiting_for_ai_prompt"] = False
        response = f"Контакти тел. {STUDENT_PHONE},\ne-mail: {STUDENT_EMAIL}"
        await update.message.reply_text(
            text=response,
            reply_markup=get_back_keyboard(),
        )
        return

    # 4. Обробка кнопки "Prompt AI"
    if (
        text == BTN_PROMPT_AI
    ):
        context.user_data["waiting_for_ai_prompt"] = True
        prompt_instruction = (
            "🤖 Введіть ваш запит для AI (Gemini):\n\n"
            "(Або натисніть кнопку «Назад» для повернення до меню)"
        )
        await update.message.reply_text(
            text=prompt_instruction,
            parse_mode="Markdown",
            reply_markup=get_back_keyboard(),
        )
        return

    # 5. Обробка кнопки "Назад"
    if text in (BTN_BACK, "Back", "⬅️ Назад", "⬅️ Back") or text_lower in ("назад", "back"):
        context.user_data["waiting_for_ai_prompt"] = False
        await update.message.reply_text(
            text=WELCOME_TEXT,
            reply_markup=get_main_menu_keyboard(),
        )
        return

    # 6. Запит до AI (якщо користувач у режимі Prompt AI або надіслав довільний текст)
    # Індикатор набору тексту "typing..."
    await context.bot.send_chat_action(chat_id=chat_id, action=ChatAction.TYPING)

    try:
        ai_reply = await ask_gemini(text)
    except Exception as exc:
        logger.exception("Помилка під час виклику ask_gemini: %s", exc)
        ai_reply = f"⚠️ Помилка обробки запиту AI: {str(exc)}"

    # Скидаємо прапорець очікування запиту
    context.user_data["waiting_for_ai_prompt"] = False

    # Відповідаємо користувачу (з розбиттям на частини, якщо довжина більше ліміту Telegram 4096 символів)
    max_chunk_size = 4000
    if len(ai_reply) <= max_chunk_size:
        await update.message.reply_text(
            text=ai_reply,
            reply_markup=get_main_menu_keyboard(),
        )
    else:
        # Відправляємо великі відповіді послідовними блоками
        for i in range(0, len(ai_reply), max_chunk_size):
            chunk = ai_reply[i : i + max_chunk_size]
            is_last = (i + max_chunk_size) >= len(ai_reply)
            await update.message.reply_text(
                text=chunk,
                reply_markup=get_main_menu_keyboard() if is_last else None,
            )
