from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session, joinedload

from database import get_db, User, Post
from schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserWithPostsResponse,
    PostResponse,
    PostSubresourceCreate,
    ErrorResponse,
)

router = APIRouter()


@router.get(
    "",
    response_model=List[Union[UserWithPostsResponse, UserResponse]],
    summary="Отримати список усіх авторів",
    description="Повертає колекцію зареєстрованих авторів. За замовчуванням повертає профільні дані без паролів. Додайте `include=posts` для включення статей кожного автора.",
    responses={
        200: {"description": "Список авторів успішно отримано"},
        500: {"model": ErrorResponse, "description": "Внутрішня помилка сервера"},
    },
)
def get_users(
    include: Optional[str] = Query(None, description="Зв'язані ресурси для включення (наприклад, 'posts')"),
    withPosts: Optional[bool] = Query(False, include_in_schema=False),
    db: Session = Depends(get_db),
):
    should_include_posts = include == "posts" or withPosts

    query = db.query(User)
    if should_include_posts:
        query = query.options(joinedload(User.posts))

    users = query.order_by(User.id.asc()).all()

    if should_include_posts:
        return [UserWithPostsResponse.model_validate(u) for u in users]
    return [UserResponse.model_validate(u) for u in users]


@router.get(
    "/{id}",
    response_model=Union[UserWithPostsResponse, UserResponse],
    summary="Отримати автора за ID",
    description="Повертає одиничний ресурс автора за його унікальним ідентифікатором. Додайте `include=posts` для включення публікацій автора.",
    responses={
        200: {"description": "Дані автора знайдено"},
        400: {"model": ErrorResponse, "description": "Невалідний ID"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
    },
)
def get_user(
    id: int,
    include: Optional[str] = Query(None, description="Включити статті автора ('posts')"),
    withPosts: Optional[bool] = Query(False, include_in_schema=False),
    db: Session = Depends(get_db),
):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID користувача (має бути додатним цілим числом)",
        )

    should_include_posts = include == "posts" or withPosts

    query = db.query(User).filter(User.id == id)
    if should_include_posts:
        query = query.options(joinedload(User.posts))

    user = query.first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Користувача з ID {id} не знайдено",
        )

    if should_include_posts:
        return UserWithPostsResponse.model_validate(user)
    return UserResponse.model_validate(user)


@router.get(
    "/{id}/posts",
    response_model=List[PostResponse],
    summary="Отримати всі статті автора (REST підресурс)",
    description="Канонічний підресурсний маршрут для отримання колекції публікацій конкретного автора.",
    responses={
        200: {"description": "Список статей автора успішно отримано"},
        400: {"model": ErrorResponse, "description": "Невалідний ID автора"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
    },
)
def get_user_posts(id: int, db: Session = Depends(get_db)):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID користувача",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Користувача з ID {id} не знайдено",
        )

    posts = (
        db.query(Post)
        .filter(Post.user_id == id)
        .order_by(Post.id.desc())
        .all()
    )
    return [PostResponse.model_validate(p) for p in posts]


@router.post(
    "/{id}/posts",
    response_model=PostResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Створити статтю для вказаного автора (REST підресурс)",
    description="Створює нову статтю безпосередньо для автора з вказаним ID у шляху.",
    responses={
        201: {"description": "Статтю успішно створено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
    },
)
def create_user_post(id: int, post_in: PostSubresourceCreate, db: Session = Depends(get_db)):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID користувача",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Користувача з ID {id} не знайдено",
        )

    new_post = Post(
        user_id=id,
        topic=post_in.topic.strip(),
        title=post_in.title.strip(),
        content=post_in.content.strip(),
        image_url=(post_in.image_url or "").strip(),
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return PostResponse.model_validate(new_post)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Створити нового автора",
    description="Додає нового автора до колекції /api/users.",
    responses={
        201: {"description": "Автора успішно створено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації вхідних даних"},
        409: {"model": ErrorResponse, "description": "Конфлікт - логін вже зайнятий"},
    },
)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username.strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Користувач із логіном '{user_in.username.strip()}' вже існує",
        )

    new_user = User(
        name=user_in.name.strip(),
        address=user_in.address.strip(),
        username=user_in.username.strip(),
        password=user_in.password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)


def _handle_update_user(id: int, user_in: UserUpdate, db: Session):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID користувача",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Користувача з ID {id} не знайдено",
        )

    if user_in.username and user_in.username.strip() != user.username:
        conflict = (
            db.query(User)
            .filter(User.username == user_in.username.strip(), User.id != id)
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Логін '{user_in.username.strip()}' вже використовується іншим користувачем",
            )
        user.username = user_in.username.strip()

    if user_in.name is not None:
        user.name = user_in.name.strip()
    if user_in.address is not None:
        user.address = user_in.address.strip()
    if user_in.password is not None:
        user.password = user_in.password

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.put(
    "/{id}",
    response_model=UserResponse,
    summary="Оновити дані автора",
    description="Повне або часткове оновлення ресурсу автора.",
    responses={
        200: {"description": "Дані автора успішно оновлено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації або невалідний ID"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
        409: {"model": ErrorResponse, "description": "Логін вже використовується"},
    },
)
def update_user_put(id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    return _handle_update_user(id, user_in, db)


@router.patch(
    "/{id}",
    response_model=UserResponse,
    summary="Частково оновити дані автора",
    description="Часткове оновлення інформації про автора.",
    responses={
        200: {"description": "Успішно оновлено"},
        400: {"model": ErrorResponse, "description": "Помилка валідації"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
        409: {"model": ErrorResponse, "description": "Логін вже використовується"},
    },
)
def update_user_patch(id: int, user_in: UserUpdate, db: Session = Depends(get_db)):
    return _handle_update_user(id, user_in, db)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Видалити автора",
    description="Видаляє автора та всі його пов'язані статті каскадно (відповідно до REST стандартів повертає 204 No Content).",
    responses={
        204: {"description": "Автора та його статті успішно видалено (тіло відповіді відсутнє)"},
        400: {"model": ErrorResponse, "description": "Невалідний ID"},
        404: {"model": ErrorResponse, "description": "Автора не знайдено"},
    },
)
def delete_user(id: int, db: Session = Depends(get_db)):
    if id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невалідний ID користувача",
        )

    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Користувача з ID {id} не знайдено",
        )

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
