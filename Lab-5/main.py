import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Забезпечуємо коректне кодування UTF-8 у консолі Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from database import init_db
from routers.users import router as users_router
from routers.posts import router as posts_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Життєвий цикл застосунку:
    При старті ініціалізує базу даних SQLite та наповнює тестовими записами.
    """
    init_db()
    yield


tags_metadata = [
    {
        "name": "Users (Автори)",
        "description": "Операції над авторами веб-сайту: отримання списку, перегляд профілю зі статтями, підресурсні маршрути, реєстрація, оновлення та видалення.",
    },
    {
        "name": "Posts (Статті)",
        "description": "Операції над статтями: отримання списку з авторами, фільтрація за автором та темою, створення, редагування та видалення.",
    },
]

app = FastAPI(
    title="Lab-5: FastAPI REST API з SQLAlchemy ORM",
    description="""
## Лабораторна робота №5 з курсу «Основи WEB технологій»
**Виконав:** студент групи **ІП-34** **Вівдиченко Максим Сергійович**  
**Варіант №9:** *«Спроектувати базу даних про авторів web-сайту і їх статтях: ім'я, адреса, обліковий запис, пароль, тема, заголовок, текст статті, ілюстрації.»*

---
### 🌟 Особливості реалізації:
* **Web-фреймворк:** [FastAPI](https://fastapi.tiangolo.com/) на Python 3
* **ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (декларативні моделі, зв'язок `1:N`, каскадне видалення `ON DELETE CASCADE`)
* **База даних:** локальна реляційна [SQLite](https://www.sqlite.org/) (`lab5.db`) з автостворенням схем та seeding
* **Валідація:** [Pydantic v2](https://docs.pydantic.dev/) (сувора типізація, регулярні вирази, обмеження довжини)
* **Інтерактивний UI:** Автозгенерований **Swagger UI** за специфікацією OpenAPI 3.1
* **API Сумісність:** Повна відповідність структурі маршрутів та контрактів з Лабораторної роботи №4
    """,
    version="1.0.0",
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Кастомна обробка HTTPException у форматі { error, message } ідентично до Lab-4
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    status_reasons = {
        400: "Bad Request",
        404: "Not Found",
        409: "Conflict",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
    }
    error_title = status_reasons.get(exc.status_code, "Error")
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_title, "message": message},
    )


# Кастомна обробка помилок валідації запитів (400 Bad Request як у Lab-4)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
    return JSONResponse(
        status_code=400,
        content={
            "error": "Bad Request",
            "message": "Помилка валідації даних",
            "errors": errors,
        },
    )


# Підключення роутів API (ідентично до Lab-4)
app.include_router(users_router, prefix="/api/users", tags=["Users (Автори)"])
app.include_router(posts_router, prefix="/api/posts", tags=["Posts (Статті)"])


# Перенаправлення з кореневої сторінки безпосередньо на автозгенерований Swagger UI
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn
    print("====================================================")
    print("🚀 Запуск сервера FastAPI (Lab-5)...")
    print("📖 Інтерактивний Swagger UI: http://127.0.0.1:8000/docs")
    print("📖 Альтернативний ReDoc:     http://127.0.0.1:8000/redoc")
    print("====================================================")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
