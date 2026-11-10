import os
import sys
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    event,
)
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Забезпечуємо коректне кодування UTF-8 у консолі Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "lab5.db")
DATABASE_URL = f"sqlite:///{DB_FILE}"

# Створення рушія SQLAlchemy для SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

# Увімкнення підтримки зовнішніх ключів (Foreign Keys) та ON DELETE CASCADE у SQLite
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ORM модель Автора (User)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Зв'язок 1:N з каскадним видаленням статей при видаленні автора
    posts = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


# ORM модель Статті (Post)
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), default="", nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Зворотний зв'язок зі статтею -> автор
    author = relationship("User", back_populates="posts")


# Залежність (dependency) для отримання сесії БД у ендпоінтах FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Створення таблиць та початкове наповнення тестовими даними (seeding)
def init_db():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if db.query(User).count() == 0:
            user1 = User(
                name="Вівдиченко Максим Сергійович",
                address="Київ, вул. Політехнічна, 16",
                username="m_vivdychenko",
                password="Pass123_Secure",
            )
            user2 = User(
                name="Сергієнко Олена Іванівна",
                address="Київ, просп. Берестейський, 37",
                username="o_serhienko",
                password="AuthorPass456",
            )
            db.add_all([user1, user2])
            db.commit()
            db.refresh(user1)
            db.refresh(user2)

            post1 = Post(
                user_id=user1.id,
                topic="Web-технології",
                title="Архітектура REST API на FastAPI з SQLAlchemy ORM",
                content="FastAPI у поєднанні з SQLAlchemy забезпечує високу швидкодію, автоматичну валідацію через Pydantic та інтерактивну документацію Swagger UI.",
                image_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c",
            )
            post2 = Post(
                user_id=user1.id,
                topic="Бази даних",
                title="Робота з SQLite через SQLAlchemy ORM у Python",
                content="Декларативні моделі, зв'язки 1:N та автоматичне створення таблиць спрощують розробку та супровід веб-сервісів.",
                image_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d",
            )
            post3 = Post(
                user_id=user2.id,
                topic="Інформаційна безпека",
                title="Основи захисту паролів та облікових записів",
                content="Валідація вхідних даних на рівні схем Pydantic та збереження цілісності зовнішніх ключів унеможливлюють некоректні стани бази даних.",
                image_url="https://images.unsplash.com/photo-1563986768609-322da13575f3",
            )
            db.add_all([post1, post2, post3])
            db.commit()
