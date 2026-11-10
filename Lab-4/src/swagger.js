import swaggerJsdoc from 'swagger-jsdoc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Динамічна конфігурація для генерації Swagger на льоту з JSDoc коментарів у роутах
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Lab-4: REST API на Node.js, Express та Sequelize ORM',
      version: '1.0.0',
      description: `
**Курс:** Основи WEB технологій  
**Тема:** REST API на Node.js та Express. CRUD операції в базі даних.  
**Варіант 9:** Спроектувати базу даних про авторів web-сайту і їх статтях: ім'я, адреса, обліковий запис, пароль, тема, заголовок, текст статті, ілюстрації.  
**Виконав:** студент гр. ІП-34 Вівдиченко М. С. (Варіант 9)  
**Технології:** Express.js + Sequelize ORM + SQLite + Swagger UI (згенеровано динамічно через \`swagger-jsdoc\` із JSDoc-коментарів).
      `,
      contact: {
        name: 'Вівдиченко Максим Сергійович',
        email: 'maksym.vivdychenko@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальний сервер розробки',
      },
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Вівдиченко Максим Сергійович' },
            address: { type: 'string', example: 'Київ, вул. Політехнічна, 16' },
            username: { type: 'string', example: 'm_vivdychenko' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUserDto: {
          type: 'object',
          required: ['name', 'address', 'username', 'password'],
          properties: {
            name: { type: 'string', example: 'Іваненко Петро Олексійович', description: "Ім'я автора" },
            address: { type: 'string', example: 'Київ, вул. Хрещатик, 22', description: 'Контактна адреса' },
            username: { type: 'string', example: 'petro_ivanenko', description: 'Унікальний логін' },
            password: { type: 'string', example: 'SecretPassword99', description: 'Пароль' },
          },
        },
        UpdateUserDto: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Іваненко Петро (Редаговано)' },
            address: { type: 'string', example: 'Київ, вул. Володимирська, 50' },
            username: { type: 'string', example: 'petro_updated' },
            password: { type: 'string', example: 'NewSecret123' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            topic: { type: 'string', example: 'Web-технології' },
            title: { type: 'string', example: 'Архітектура REST API на Node.js та Express' },
            content: { type: 'string', example: 'Текст статті...' },
            image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PostWithAuthor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 1 },
            topic: { type: 'string', example: 'Web-технології' },
            title: { type: 'string', example: 'Архітектура REST API на Node.js та Express' },
            content: { type: 'string', example: 'Текст статті...' },
            image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            author: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 1 },
                name: { type: 'string', example: 'Вівдиченко Максим Сергійович' },
                username: { type: 'string', example: 'm_vivdychenko' },
              },
            },
          },
        },
        CreatePostDto: {
          type: 'object',
          required: ['user_id', 'topic', 'title', 'content'],
          properties: {
            user_id: { type: 'integer', example: 1, description: 'ID автора статті' },
            topic: { type: 'string', example: 'Штучний Інтелект', description: 'Тема статті' },
            title: { type: 'string', example: 'Застосування LLM у веб-розробці', description: 'Заголовок' },
            content: { type: 'string', example: 'Детальний опис...', description: 'Текст статті' },
            image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe', description: 'Ілюстрація' },
          },
        },
        UpdatePostDto: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 1 },
            topic: { type: 'string', example: 'Штучний Інтелект (Оновлено)' },
            title: { type: 'string', example: 'Нові можливості LLM 2026' },
            content: { type: 'string', example: 'Оновлений зміст статті...' },
            image_url: { type: 'string', example: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Bad Request' },
            message: { type: 'string', example: 'Помилка валідації даних' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ["Поле 'name' є обов'язковим"],
            },
          },
        },
      },
    },
  },
  // Шляхи до файлів роутів, де swagger-jsdoc шукатиме анотації @openapi
  apis: [
    path.join(__dirname, 'routes', '*.js').replace(/\\/g, '/'),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
