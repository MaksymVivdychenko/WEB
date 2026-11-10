import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { initDatabase } from './database.js';
import usersRoutes from './routes/users.routes.js';
import postsRoutes from './routes/posts.routes.js';
import { swaggerSpec } from './swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Обробка невалідного JSON у тілі запиту
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Некоректний синтаксис JSON у тілі запиту',
    });
  }
  next(err);
});

// Swagger UI - динамічна генерація на льоту з JSDoc анотацій через swagger-jsdoc
app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Lab-4 Swagger UI | Варіант 9 (Sequelize ORM)',
  })
);

// Перенаправлення з кореневого маршруту на Swagger UI
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Підключення REST API маршрутів
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);

// Обробка неіснуючих маршрутів (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Маршрут ${req.method} ${req.originalUrl} не знайдено. Перейдіть на /docs для перегляду Swagger документації.`,
  });
});

// Глобальний обробник помилок
app.use((err, req, res, next) => {
  console.error('Помилка сервера:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Внутрішня помилка сервера',
  });
});

// Ініціалізація бази даних та запуск сервера
await initDatabase();

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Сервер Lab-4 успішно запущено на порту ${PORT}`);
  console.log(`📖 Інтерактивний Swagger UI: http://localhost:${PORT}/docs`);
  console.log(`🔗 REST API Users:         http://localhost:${PORT}/api/users`);
  console.log(`🔗 REST API Posts:         http://localhost:${PORT}/api/posts`);
  console.log(`====================================================`);
});

export default app;
