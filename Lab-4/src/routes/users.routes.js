import { Router } from 'express';
import { User, Post } from '../database.js';
import { validateUser, validatePost, parseIdParam } from '../validation.js';

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users (Автори)
 *     summary: Отримати список усіх авторів
 *     description: |
 *       Повертає колекцію зареєстрованих авторів.
 *       - За замовчуванням повертає профільні дані авторів без паролів.
 *       - Додайте `include=posts` для включення статей кожного автора.
 *     parameters:
 *       - name: include
 *         in: query
 *         required: false
 *         description: Зв'язані ресурси для включення (наприклад, 'posts')
 *         schema:
 *           type: string
 *           enum: [posts]
 *     responses:
 *       200:
 *         description: Список авторів успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Внутрішня помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res, next) => {
  try {
    const shouldIncludePosts = req.query.include === 'posts' || req.query.withPosts === 'true';

    const users = await User.findAll({
      attributes: ['id', 'name', 'address', 'username', 'createdAt', 'updatedAt'],
      ...(shouldIncludePosts && {
        include: [
          {
            model: Post,
            as: 'posts',
            attributes: ['id', 'topic', 'title', 'content', 'image_url', 'createdAt'],
          },
        ],
      }),
      order: [['id', 'ASC']],
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users (Автори)
 *     summary: Отримати автора за ID
 *     description: |
 *       Повертає одиничний ресурс автора за його унікальним ідентифікатором.
 *       - Додайте `include=posts` для включення публікацій автора.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID автора
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: include
 *         in: query
 *         required: false
 *         description: Включити статті автора ('posts')
 *         schema:
 *           type: string
 *           enum: [posts]
 *     responses:
 *       200:
 *         description: Дані автора знайдено
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - $ref: '#/components/schemas/UserWithPosts'
 *       400:
 *         description: Невалідний ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Автора не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID користувача (має бути додатним цілим числом)' });
    }

    const shouldIncludePosts = req.query.include === 'posts' || req.query.withPosts === 'true';

    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'address', 'username', 'createdAt', 'updatedAt'],
      ...(shouldIncludePosts && {
        include: [
          {
            model: Post,
            as: 'posts',
            attributes: ['id', 'topic', 'title', 'content', 'image_url', 'createdAt'],
          },
        ],
      }),
    });

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: `Користувача з ID ${id} не знайдено` });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users/{id}/posts:
 *   get:
 *     tags:
 *       - Users (Автори)
 *     summary: Отримати всі статті автора (REST підресурс)
 *     description: Канонічний підресурсний маршрут для отримання колекції публікацій конкретного автора
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID автора
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Список статей автора успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 *       400:
 *         description: Невалідний ID автора
 *       404:
 *         description: Автора не знайдено
 *   post:
 *     tags:
 *       - Users (Автори)
 *     summary: Створити статтю для вказаного автора (REST підресурс)
 *     description: Створює нову статтю безпосередньо для автора з вказаним ID у шляху
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID автора
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topic, title, content]
 *             properties:
 *               topic:
 *                 type: string
 *                 example: Web-технології
 *               title:
 *                 type: string
 *                 example: RESTful проектування ресурсів
 *               content:
 *                 type: string
 *                 example: Зміст нової публікації...
 *               image_url:
 *                 type: string
 *                 example: https://images.unsplash.com/photo-1555066931-4365d14bab8c
 *     responses:
 *       201:
 *         description: Статтю успішно створено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Помилка валідації
 *       404:
 *         description: Автора не знайдено
 */
router.get('/:id/posts', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID користувача' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: `Користувача з ID ${id} не знайдено` });
    }

    const posts = await Post.findAll({
      where: { user_id: id },
      order: [['id', 'DESC']],
    });

    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/posts', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID користувача' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: `Користувача з ID ${id} не знайдено` });
    }

    const payload = { ...req.body, user_id: id };
    const validationErrors = validatePost(payload, false);
    if (validationErrors) {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації даних', errors: validationErrors });
    }

    const post = await Post.create({
      user_id: id,
      topic: req.body.topic.trim(),
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      image_url: req.body.image_url ? req.body.image_url.trim() : '',
    });

    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags:
 *       - Users (Автори)
 *     summary: Створити нового автора
 *     description: Додає нового автора до колекції /api/users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: Автора успішно створено (201 Created)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Помилка валідації вхідних даних
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Конфлікт - логін вже зайнятий
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validateUser(req.body, false);
    if (validationErrors) {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації даних', errors: validationErrors });
    }

    const { name, address, username, password } = req.body;

    const existing = await User.findOne({ where: { username: username.trim() } });
    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Користувач із логіном '${username.trim()}' вже існує`,
      });
    }

    const newUser = await User.create({
      name: name.trim(),
      address: address.trim(),
      username: username.trim(),
      password,
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Conflict', message: 'Користувач із таким логіном вже існує' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації', errors: err.errors.map((e) => e.message) });
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users (Автори)
 *     summary: Оновити дані автора
 *     description: Повне або часткове оновлення ресурсу автора
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID автора
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: Дані автора успішно оновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Помилка валідації або невалідний ID
 *       404:
 *         description: Автора не знайдено
 *       409:
 *         description: Логін вже використовується
 *   patch:
 *     tags:
 *       - Users (Автори)
 *     summary: Частково оновити дані автора
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserDto'
 *     responses:
 *       200:
 *         description: Успішно оновлено
 */
const handleUpdateUser = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID користувача' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: `Користувача з ID ${id} не знайдено` });
    }

    const validationErrors = validateUser(req.body, true);
    if (validationErrors) {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації даних', errors: validationErrors });
    }

    const { name, address, username, password } = req.body;

    if (username && username.trim() !== user.username) {
      const conflict = await User.findOne({ where: { username: username.trim() } });
      if (conflict && conflict.id !== id) {
        return res.status(409).json({
          error: 'Conflict',
          message: `Логін '${username.trim()}' вже використовується іншим користувачем`,
        });
      }
    }

    await user.update({
      ...(name !== undefined && { name: name.trim() }),
      ...(address !== undefined && { address: address.trim() }),
      ...(username !== undefined && { username: username.trim() }),
      ...(password !== undefined && { password }),
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Conflict', message: 'Логін вже зайнятий' });
    }
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації', errors: err.errors.map((e) => e.message) });
    }
    next(err);
  }
};

router.put('/:id', handleUpdateUser);
router.patch('/:id', handleUpdateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users (Автори)
 *     summary: Видалити автора
 *     description: Видаляє автора та всі його повʼязані статті каскадно (відповідно до REST стандартів повертає 204 No Content)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID автора
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       204:
 *         description: Автора та його статті успішно видалено (тіло відповіді відсутнє)
 *       400:
 *         description: Невалідний ID
 *       404:
 *         description: Автора не знайдено
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID користувача' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: `Користувача з ID ${id} не знайдено` });
    }

    await user.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
