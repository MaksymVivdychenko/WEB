import logging
import sys
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters

from config import TELEGRAM_BOT_TOKEN
from handlers import start_handler, help_handler, text_message_handler

# Забезпечення коректного виведення UTF-8 (включаючи емодзі) у терміналах Windows
if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Налаштування формату логування
logging.basicConfig(
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger("telegram_bot")


def create_bot_app():
    """
    Створення та налаштування екземпляра Application Telegram-бота.
    """
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN.startswith("YOUR_TELEGRAM"):
        logger.warning(
            "⚠️ УВАГА: TELEGRAM_BOT_TOKEN не вказано або має значення за замовчуванням у файлі .env!\n"
            "Будь ласка, відкрийте файл .env та вкажіть реальний токен вашого бота від @BotFather."
        )

    # Ініціалізація Application з токеном
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    # Реєстрація команд
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("menu", start_handler))
    app.add_handler(CommandHandler("help", help_handler))

    # Реєстрація обробника текстових повідомлень (кнопки меню, назад та запити до AI)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_message_handler))

    return app


def main():
    """
    Головна точка входу для запуску бота.
    """
    if not TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN.startswith("YOUR_TELEGRAM"):
        print("\n" + "=" * 70)
        print("❌ ПОМИЛКА: Не вказано дійсний TELEGRAM_BOT_TOKEN!")
        print("1. Отримайте токен у Telegram у бота @BotFather")
        print("2. Вставте токен у файл lab-3/.env у поле TELEGRAM_BOT_TOKEN")
        print("3. Запустіть бот знову: python bot.py")
        print("=" * 70 + "\n")
        sys.exit(1)

    logger.info("Запуск Telegram-бота для Лабораторної роботи №3...")
    app = create_bot_app()
    logger.info("Бот запущено в режимі Polling. Натисніть Ctrl+C для зупинки.")
    app.run_polling()


if __name__ == "__main__":
    main()
