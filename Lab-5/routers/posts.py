from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from database import get_db, Post, User
from schemas import (
    PostCreate,
    PostUpdate,
    PostResponse,
    PostWithAuthorResponse,
    ErrorResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[Union[PostWithAuthorResponse, PostResponse]],
    summary="Отримати список статей",
    description="Повертає список статей згідно з принципами REST. За замовчуванням повертаються тільки поля статті. Використовуйте `include=author` для приєднання даних автора. Використовуйте `userId` та `topic` для фільтрації.",
    responses={
        200: {"description": "Список статей успішно отримано"},
        400: {"model": ErrorResponse, "description": "Невалідні параметри фільтрації"},
        500: {"model": ErrorResponse, "description": "Внутрішня помилка сервера"},
    },
)
def get_posts(
    include: Optional[str] = Query(None, description="Зв'язані ресурси для включення (наприклад, 'author')"),
    withAuthor: Optional[bool] = Query(False, include_in_schema=False),
    userId: Optional[int] = Query(None, description="Фільтрація списку за ID автора (user_id)"),
    user_id: Optional[int] = Query(None, include_in_schema=False),
    topic: Optional[str] = Query(None, description="Фільтрація за темою статті"),
    db: Session = Depends(get_db),
):
    author_id = userId or user_id
    if author_id is not None and author_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Параметр фільтрації 'userId' має бути додатним цілим числом",
        )

    should_include_author = include == "author" or withAuthor

    query = db.query(Post)
    if should_include_author:
        query = query.options(joinedload(Post.author))

    if author_id is not None:
        query = query.filter(Post.user_id == author_id)
    if topic and topic.strip():
        query = query.filter(Post.topic == topic.strip())

    posts = query.order_by(Post.id.desc()).all()

    if should_include_author:
        return [PostWithAuthorResponse.model_validate(p) for p in posts]
    return [PostResponse.model_validate(p) for p in posts]


@router.get(
    "/{id}",
    response_model=Union[PostWithAuthorResponse, PostResponse],
    summary="Отримати статтю за ID",
    description="Повертає одиничний ресурс статті за її унікальним ідентифікатором. Додайте параметр `include=author` для отримання статті разом із об'єктом автора.",
    responses={
        200: {"description": "Статтю знайдено"},
        400: {"model": ErrorResponse, "description": "Невалідний ID"},
        404: {"model": ErrorResponse, "description": "Статтю не знайдено"},
    },
)
def get_post(
    id: int,
    include: Optional[str] = Query(None, description="Включити дані автора ('author')"),
    withAuthor: Optional[bool] = Query(False, include_in_schema=False),
    db: Session = Depends(get_db),
):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID статті",
        )

    should_include_author = include == "author" or withAuthor

    query = db.query(Post).filter(Post.id == id)
    if should_include_author:
        query = query.options(joinedload(Post.author))

    post = query.first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Статтю з ID {id} не знайдено",
        )

    if should_include_author:
        return PostWithAuthorResponse.model_validate(post)
    return PostResponse.model_validate(post)


@router.post(
    "",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Створити нову статтю",
    description="Додає новий ресурс статті до колекції /api/posts.",
    responses={
        201: {"description": "Статтю успішно створено (201 Created)"},
        400: {"model": ErrorResponse, "description": "Помилка валідації або автора з вказаним user_id не існує"},
    },
)
def create_post(post_in: PostCreate, db: Session = Depends(get_db)):
    author = db.query(User).filter(User.id == post_in.user_id).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Автора з ID {post_in.user_id} не знайдено в базі даних. Спочатку створіть автора.",
        )

    new_post = Post(
        user_id=post_in.user_id,
        topic=post_in.topic.strip(),
        title=post_in.title.strip(),
        content=post_in.content.strip(),
        image_url=(post_in.image_url or "").strip(),
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return PostResponse.model_validate(new_post)


def _handle_update_post(id: int, post_in: PostUpdate, db: Session):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID статті",
        )

    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Статтю з ID {id} не знайдено",
        )

    if post_in.user_id is not None:
        author = db.query(User).filter(User.id == post_in.user_id).first()
        if not author:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Вказаного автора з ID {post_in.user_id} не існує",
            )
        post.user_id = post_in.user_id

    if post_in.topic is not None:
        post.topic = post_in.topic.strip()
    if post_in.title is not None:
        post.title = post_in.title.strip()
    if post_in.content is not None:
        post.content = post_in.content.strip()
    if post_in.image_url is not None:
        post.image_url = post_in.image_url.strip()

    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)


@router.put(
    "/{id}",
    response_model=PostResponse,
    summary="Оновити статтю",
    description="Оновлює існуючий ресурс статті за вказаним ID.",
    responses={
        200: {"description": "Статтю успішно оновлено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації або автора не існує"},
        404: {"model": ErrorResponse, "description": "Статтю не знайдено"},
    },
)
def update_post_put(id: int, post_in: PostUpdate, db: Session = Depends(get_db)):
    return _handle_update_post(id, post_in, db)


@router.patch(
    "/{id}",
    response_model=PostResponse,
    summary="Частково оновити статтю",
    description="Оновлює окремі поля існуючої статті.",
    responses={
        200: {"description": "Статтю успішно оновлено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації"},
        404: {"model": ErrorResponse, "description": "Статтю не знайдено"},
    },
)
def update_post_patch(id: int, post_in: PostUpdate, db: Session = Depends(get_db)):
    return _handle_update_post(id, post_in, db)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Видалити статтю",
    description="Видаляє ресурс статті за її ID (відповідно до REST стандартів повертає 204 No Content).",
    responses={
        204: {"description": "Статтю успішно видалено (тіло відповіді відсутнє)"},
        400: {"model": ErrorResponse, "description": "Невалідний ID"},
        404: {"model": ErrorResponse, "description": "Статтю не знайдено"},
    },
)
def delete_post(id: int, db: Session = Depends(get_db)):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID статті",
        )

    post = db.query(Post).filter(Post.id == id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Статтю з ID {id} не знайдено",
        )

    db.delete(post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
