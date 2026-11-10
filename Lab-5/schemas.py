from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, ConfigDict, Field


# --- Схеми для Користувачів (Авторів) ---

class UserBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Ім'я та прізвище автора",
        examples=["Вівдиченко Максим Сергійович"],
    )
    address: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Поштова або фізична адреса автора",
        examples=["Київ, вул. Політехнічна, 16"],
    )
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_.-]+$",
        description="Унікальний логін облікового запису (латиниця, цифри, крапка, дефіс, підкреслення)",
        examples=["m_vivdychenko"],
    )


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=4,
        max_length=100,
        description="Пароль автора",
        examples=["Pass123_Secure"],
    )


class UserUpdate(BaseModel):
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Нове ім'я автора",
    )
    address: Optional[str] = Field(
        None,
        min_length=3,
        max_length=255,
        description="Нова адреса автора",
    )
    username: Optional[str] = Field(
        None,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_.-]+$",
        description="Новий унікальний логін",
    )
    password: Optional[str] = Field(
        None,
        min_length=4,
        max_length=100,
        description="Новий пароль",
    )


class AuthorShort(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    username: str


# --- Схеми для Статей (Posts) ---

class PostBase(BaseModel):
    topic: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Тема статті",
        examples=["Web-технології"],
    )
    title: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Заголовок статті",
        examples=["Архітектура REST API на FastAPI з SQLAlchemy ORM"],
    )
    content: str = Field(
        ...,
        min_length=5,
        description="Текст статті",
        examples=["FastAPI забезпечує високу швидкодію та автодокументацію."],
    )
    image_url: Optional[str] = Field(
        default="",
        max_length=500,
        description="Посилання на ілюстрацію",
        examples=["https://images.unsplash.com/photo-1555066931-4365d14bab8c"],
    )


class PostCreate(PostBase):
    user_id: int = Field(
        ...,
        ge=1,
        description="ID автора статті (зовнішній ключ на таблицю users)",
        examples=[1],
    )


class PostSubresourceCreate(PostBase):
    """Створення статті через підресурсний маршрут /api/users/{id}/posts"""
    pass


class PostUpdate(BaseModel):
    topic: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Оновлена тема",
    )
    title: Optional[str] = Field(
        None,
        min_length=2,
        max_length=200,
        description="Оновлений заголовок",
    )
    content: Optional[str] = Field(
        None,
        min_length=5,
        description="Оновлений текст",
    )
    image_url: Optional[str] = Field(
        None,
        max_length=500,
        description="Оновлене посилання на ілюстрацію",
    )
    user_id: Optional[int] = Field(
        None,
        ge=1,
        description="Оновлений ID автора",
    )


class PostShortResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Унікальний ID статті", examples=[1])
    created_at: datetime = Field(..., description="Дата та час публікації")
    updated_at: datetime = Field(..., description="Дата та час останнього оновлення")


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Унікальний ID статті", examples=[1])
    user_id: int = Field(..., description="ID автора статті", examples=[1])
    created_at: datetime = Field(..., description="Дата та час публікації")
    updated_at: datetime = Field(..., description="Дата та час останнього оновлення")


class PostWithAuthorResponse(PostResponse):
    model_config = ConfigDict(from_attributes=True)

    author: AuthorShort = Field(
        ...,
        description="Коротка інформація про автора статті (при include=author)",
    )


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Унікальний ID автора", examples=[1])
    created_at: datetime = Field(..., description="Дата та час реєстрації")
    updated_at: datetime = Field(..., description="Дата та час останнього оновлення")


class UserWithPostsResponse(UserResponse):
    model_config = ConfigDict(from_attributes=True)

    posts: List[PostShortResponse] = Field(
        default=[],
        description="Список публікацій автора (при include=posts)",
    )


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Назва помилки")
    message: str = Field(..., description="Опис помилки")
    errors: Optional[List[str]] = Field(default=None, description="Список детальних помилок")
