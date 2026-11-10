# Лабораторна робота №2: Створення системи реєстрації та авторизації за допомогою JWT токенів

**Технологічний стек:** NestJS, TypeScript, SQLite (TypeORM + better-sqlite3), Passport JWT, Bcrypt.

---

## 📌 Реалізовані вимоги з методичних вказівок

1. **Реєстрація користувачів:**
   - Паролі зберігаються виключно у зашифрованому вигляді через бібліотеку `bcrypt` (10 раундів солі).
   - Підтримка призначення ролей (`USER` або `ADMIN`).
2. **JWT-авторизація з персональними даними студента:**
   - До корисного навантаження (`payload`) JWT токена автоматично записуються: **прізвище**, **ініціали**, **академічна група** та **номер варіанта**.
   - Розрахунок часу життя токена: `expiration time = (60 + N) секунд`, де $N$ — номер варіанта (наприклад, для варіанта 1 термін дії становить 61 с).
3. **Захист маршрутів:**
   - Авторизація через заголовок `Authorization: Bearer <token>`.
   - При відсутності або невалідності токена повертається `401 Unauthorized`.
4. **Рольовий доступ (`USER` та `ADMIN`):**
   - Ендпоінт для адміністратора захищений перевіркою ролей (`RolesGuard`).
   - Якщо користувач зі звичайною роллю `USER` намагається отримати доступ, сервер повертає `403 Forbidden`.
   - Якщо доступ виконує `ADMIN`, повертається повний список зареєстрованих користувачів (як у методичці).
5. **База даних:**
   - **SQLite** (`lab2.sqlite`) — швидка, автономна, не вимагає встановлення сторонніх серверів баз даних.

---

## ⚙️ Конфігурація даних студента

Всі дані студента винесені в єдиний конфігураційний файл [`.env`](.env) та [src/config/student.config.ts](src/config/student.config.ts):

```env
PORT=3000
JWT_SECRET=lab2_jwt_super_secret_key_2026

# Персональні дані студента:
STUDENT_LAST_NAME=Вівдиченко
STUDENT_INITIALS=М. С.
STUDENT_GROUP=ІП-XX
STUDENT_VARIANT=1
```

> **Примітка:** При зміні `STUDENT_VARIANT` час життя токена автоматично перераховується за формулою `60 + N` секунд.

---

## 🚀 Ендпоінти API

### 1. `POST /auth/register` (Реєстрація)
- **Тіло запиту (JSON):**
  ```json
  {
    "username": "student_user",
    "password": "UserPass123!",
    "roles": ["USER"]
  }
  ```
- **Відповідь (201 Created):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "id": 1,
      "username": "student_user",
      "roles": ["USER"],
      "createdAt": "2026-10-17T10:35:34Z"
    }
  }
  ```

---

### 2. `POST /auth/login` (Авторизація)
- **Тіло запиту (JSON):**
  ```json
  {
    "username": "student_user",
    "password": "UserPass123!"
  }
  ```
- **Відповідь (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 61,
    "studentInfo": {
      "lastName": "Вівдиченко",
      "initials": "М. С.",
      "group": "ІП-XX",
      "variant": 1,
      "calculatedExpiration": "60 + 1 = 61s"
    }
  }
  ```

---

### 3. `GET /auth/profile` (Базовий ендпоінт для всіх авторизованих користувачів)
- **Заголовок:** `Authorization: Bearer <token>`
- **Доступ:** Будь-який авторизований користувач (`USER` або `ADMIN`).
- **Відповідь (200 OK):**
  ```json
  {
    "message": "Access granted: Basic endpoint accessible to all authenticated users",
    "authenticatedUser": {
      "userId": 1,
      "username": "student_user",
      "roles": ["USER"],
      "student": {
        "lastName": "Вівдиченко",
        "initials": "М. С.",
        "group": "ІП-XX",
        "variant": 1
      },
      "exp": 1792233416,
      "iat": 1792233355
    }
  }
  ```

---

### 4. `GET /admin/users` (Адміністративний ендпоінт)
- **Заголовок:** `Authorization: Bearer <adminToken>`
- **Доступ:** Тільки `ADMIN`.
- **Якщо викликає звичайний користувач:** `403 Forbidden` (`Access denied: You do not have the required role (ADMIN)`).
- **Якщо викликає ADMIN (200 OK):**
  ```json
  {
    "message": "User management list retrieved successfully (ADMIN privilege)",
    "requestedBy": "admin_boss",
    "totalUsers": 2,
    "users": [
      {
        "id": 1,
        "username": "student_user",
        "roles": ["USER"],
        "createdAt": "2026-10-17T10:35:34Z"
      },
      {
        "id": 2,
        "username": "admin_boss",
        "roles": ["ADMIN"],
        "createdAt": "2026-10-17T10:35:34Z"
      }
    ]
  }
  ```

---

## 🧪 Тестування через Postman

У корені проекту створено готовий файл тестів: **[`Lab2_NestJS.postman_collection.json`](Lab2_NestJS.postman_collection.json)**.

### Як запустити тести у Postman:
1. Відкрийте програму **Postman**.
2. Натисніть кнопку **Import** (зверху ліворуч).
3. Перетягніть або виберіть файл `Lab2_NestJS.postman_collection.json`.
4. Виберіть імпортовану колекцію **"Lab 2 - NestJS JWT Auth & Role Authorization"** і натисніть **Run collection**.
5. Усі 8 тестів виконаються автоматично із зеленими галочками (16 перевірок `pm.test`):
   - Реєстрація користувача та адміна
   - Логін та автозбереження токенів у змінні оточення
   - Перевірка часу життя `60 + N`
   - Перевірка доступу до профілю
   - Перевірка заборони `403 Forbidden` для звичайного користувача
   - Перевірка дозволу `200 OK` для адміна
   - Перевірка блокування `401 Unauthorized` без токена.

Також можна запустити тести через консоль за допомогою Newman:
```bash
npx newman run Lab2_NestJS.postman_collection.json
```

---

## 🏃 Запуск проекту

```bash
# Встановлення залежностей (якщо потрібно)
npm install

# Запуск у режимі розробки
npm run start:dev

# Збірка проекту
npm run build
```
