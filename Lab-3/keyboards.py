from telegram import KeyboardButton, ReplyKeyboardMarkup

BTN_STUDENT = "Student"
BTN_IT_TECH = "IT-technologies"
BTN_CONTACTS = "Contacts"
BTN_PROMPT_AI = "Prompt AI"

BTN_BACK = "Назад"


def get_main_menu_keyboard() -> ReplyKeyboardMarkup:
    keyboard = [
        [KeyboardButton(BTN_STUDENT)],
        [KeyboardButton(BTN_IT_TECH)],
        [KeyboardButton(BTN_CONTACTS)],
        [KeyboardButton(BTN_PROMPT_AI)],
    ]
    return ReplyKeyboardMarkup(
        keyboard,
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def get_back_keyboard() -> ReplyKeyboardMarkup:
    keyboard = [
        [KeyboardButton(BTN_BACK)],
    ]
    return ReplyKeyboardMarkup(
        keyboard,
        resize_keyboard=True,
        one_time_keyboard=False,
    )
