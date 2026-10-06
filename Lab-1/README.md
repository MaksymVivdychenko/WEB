# Лабораторна робота №1: Протокол WebSocket. Використання Socket.io для розробки чат-додатків

Цей проект реалізує веб-застосунок для обміну повідомленнями в режимі реального часу (chat) з використанням **NestJS** (WebSocket Gateway + Socket.IO) на бекенді та **Angular** на фронтенді, з інтерфейсом, що точно відповідає методичним вказівкам.

---

## 🚀 Стек технологій

- **Бекенд**: [NestJS](https://nestjs.com/) v10 (`@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`)
- **Фронтенд**: [Angular](https://angular.dev/) v22 (Standalone Components, Signals, `socket.io-client`)
- **Стилізація**: Чистий CSS згідно з макетом та скріншотами лабораторної роботи №1

---

## 📋 Виконані вимоги лабораторної роботи

1. **Кімнати та користувачі**:
   - Екран входу з полями **Username** та **Room** і кнопкою **«Приєднатись»**.
   - Ліва панель із відображенням поточної кімнати (`Room: ...`), логіну (`Username: ...`) та списку активних користувачів (`Users in the chatroom:`).
2. **Системні повідомлення (Admin)**:
   - Привітання при вході: `Admin [час]: Welcome, <username>!` (синій/бірюзовий блок).
   - Сповіщення кімнати: `Admin [час]: <username> has joined!` та `<username> has left!`.
3. **Повідомлення користувачів**:
   - Відправка повідомлень через поле вводу та кнопку **«Send»** або `Enter`.
   - Зелений блок повідомлення з ім'ям відправника та часом.
4. **Автоматичне повідомлення за варіантом**:
   - Вимога: постійна автоматична видача всім учасникам:
     > *«Автоматичне повідомлення від ст. Вівдиченко Максим Сергійович гр. ІП-34 Варіант 9 [час]»*
   - Періодичність: **19 секунд** (формула: $10 + N = 10 + 9 = 19$ сек.).
   - Відображається окремим виділеним жовтим блоком.

---

## 🛠 Запуск проекту

### Спосіб А: Запуск через Docker Compose (Рекомендовано)

Найпростіший спосіб запустити весь проект однією командою (потрібен запущений Docker Desktop):

```bash
docker compose up --build
```

- **Frontend (Angular)**: `http://localhost:4200`
- **Backend (NestJS WebSocket)**: `http://localhost:3000` (та `ws://localhost:3000`)

Щоб зупинити контейнери:
```bash
docker compose down
```

---

### Спосіб Б: Локальний запуск (без Docker)

#### 1. Запуск бекенду (NestJS)

```bash
cd "server"
npm install
npm run start:dev
```
Сервер запуститься на `http://localhost:3000` (WebSocket на `ws://localhost:3000`).

#### 2. Запуск фронтенду (Angular)

```bash
cd "client"
npm install
npm start
```
Клієнт буде доступний за адресою `http://localhost:4200`.


---

## ⚙️ Параметри студента та варіанта

Константи задані у файлі [server/src/config/student.config.ts](file:///c:/study/7%20sem/WEB/Lab-1/server/src/config/student.config.ts):

```typescript
export const STUDENT_NAME = 'Вівдиченко Максим Сергійович';
export const STUDENT_GROUP = 'ІП-34';
export const STUDENT_VARIANT = 9;
export const BROADCAST_INTERVAL_SECONDS = 19; // 10 + 9
export const BROADCAST_INTERVAL_MS = BROADCAST_INTERVAL_SECONDS * 1000;
export const AUTO_BROADCAST_TEXT = `Автоматичне повідомлення від ст. ${STUDENT_NAME} гр. ${STUDENT_GROUP} Варіант ${STUDENT_VARIANT}`;
```

