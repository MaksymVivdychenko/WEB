import { Router } from 'express';
import { Post, User } from '../database.js';
import { validatePost, parseIdParam } from '../validation.js';

const router = Router();

/**
 * @openapi
 * /api/posts:
 *   get:
 *     tags:
 *       - Posts (Статті)
 *     summary: Отримати список статей
 *     description: |
 *       Повертає список статей згідно з канонічними принципами REST.
 *       - За замовчуванням повертаються чисті (сирі) дані з колекції `posts`.
 *       - Використовуйте параметр запиту `include=author` для приєднання даних автора (`LEFT JOIN users`).
 *       - Використовуйте `userId` для фільтрації статей конкретного автора.
 *       - Використовуйте `topic` для фільтрації за темою.
 *     parameters:
 *       - name: include
 *         in: query
 *         required: false
 *         description: Зв'язані ресурси для включення у відповідь (наприклад, 'author')
 *         schema:
 *           type: string
 *           enum: [author]
 *       - name: userId
 *         in: query
 *         required: false
 *         description: Фільтрація списку за ID автора (user_id)
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: topic
 *         in: query
 *         required: false
 *         description: Фільтрація за темою статті
 *         schema:
 *           type: string
 *           example: Web-технології
 *     responses:
 *       200:
 *         description: Список статей успішно отримано
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/Post'
 *                   - $ref: '#/components/schemas/PostWithAuthor'
 *       500:
 *         description: Внутрішня помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req, res, next) => {
  try {
    const { include, userId, user_id, topic } = req.query;
    const authorId = userId || user_id;

    // Побудова умов фільтрації (WHERE)
    const where = {};
    if (authorId) {
      const parsedUserId = parseIdParam(authorId);
      if (!parsedUserId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: "Параметр фільтрації 'userId' має бути додатним цілим числом",
        });
      }
      where.user_id = parsedUserId;
    }
    if (topic && typeof topic === 'string' && topic.trim() !== '') {
      where.topic = topic.trim();
    }

    // Перевірка потреби приєднання автора через include (REST projection)
    const shouldIncludeAuthor = include === 'author' || req.query.withAuthor === 'true';

    const posts = await Post.findAll({
      where,
      ...(shouldIncludeAuthor && {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'username'],
          },
        ],
      }),
      order: [['id', 'DESC']],
    });

    res.json(posts);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     tags:
 *       - Posts (Статті)
 *     summary: Отримати статтю за ID
 *     description: |
 *       Повертає одиничний ресурс статті за її унікальним ідентифікатором.
 *       - За замовчуванням повертаються тільки поля статті.
 *       - Додайте параметр `include=author` для отримання статті разом із об'єктом автора.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID статті
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: include
 *         in: query
 *         required: false
 *         description: Включити дані автора ('author')
 *         schema:
 *           type: string
 *           enum: [author]
 *     responses:
 *       200:
 *         description: Статтю знайдено
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Post'
 *                 - $ref: '#/components/schemas/PostWithAuthor'
 *       400:
 *         description: Невалідний ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Статтю не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID статті' });
    }

    const shouldIncludeAuthor = req.query.include === 'author' || req.query.withAuthor === 'true';

    const post = await Post.findByPk(id, {
      ...(shouldIncludeAuthor && {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'name', 'username'],
          },
        ],
      }),
    });

    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: `Статтю з ID ${id} не знайдено` });
    }

    res.json(post);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/posts:
 *   post:
 *     tags:
 *       - Posts (Статті)
 *     summary: Створити нову статтю
 *     description: Додає новий ресурс статті до колекції /api/posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostDto'
 *     responses:
 *       201:
 *         description: Статтю успішно створено (201 Created)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Помилка валідації або автора з вказаним user_id не існує
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', async (req, res, next) => {
  try {
    const validationErrors = validatePost(req.body, false);
    if (validationErrors) {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації даних', errors: validationErrors });
    }

    const { user_id, topic, title, content, image_url } = req.body;

    const author = await User.findByPk(user_id);
    if (!author) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Автора з ID ${user_id} не знайдено в базі даних. Спочатку створіть автора.`,
      });
    }

    const newPost = await Post.create({
      user_id,
      topic: topic.trim(),
      title: title.trim(),
      content: content.trim(),
      image_url: image_url ? image_url.trim() : '',
    });

    res.status(201).json(newPost);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації', errors: err.errors.map((e) => e.message) });
    }
    next(err);
  }
});

/**
 * @openapi
 * /api/posts/{id}:
 *   put:
 *     tags:
 *       - Posts (Статті)
 *     summary: Оновити статтю
 *     description: Оновлює існуючий ресурс статті за вказаним ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID статті
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostDto'
 *     responses:
 *       200:
 *         description: Статтю успішно оновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Помилка валідації або автора не існує
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Статтю не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags:
 *       - Posts (Статті)
 *     summary: Частково оновити статтю
 *     description: Оновлює окремі поля існуючої статті
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID статті
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePostDto'
 *     responses:
 *       200:
 *         description: Статтю успішно оновлено
 *       400:
 *         description: Помилка валідації
 *       404:
 *         description: Статтю не знайдено
 */
const handleUpdatePost = async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID статті' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: `Статтю з ID ${id} не знайдено` });
    }

    const validationErrors = validatePost(req.body, true);
    if (validationErrors) {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації даних', errors: validationErrors });
    }

    const { user_id, topic, title, content, image_url } = req.body;

    if (user_id !== undefined) {
      const authorExists = await User.findByPk(user_id);
      if (!authorExists) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Вказаного автора з ID ${user_id} не існує`,
        });
      }
    }

    await post.update({
      ...(user_id !== undefined && { user_id }),
      ...(topic !== undefined && { topic: topic.trim() }),
      ...(title !== undefined && { title: title.trim() }),
      ...(content !== undefined && { content: content.trim() }),
      ...(image_url !== undefined && { image_url: image_url.trim() }),
    });

    res.json(post);
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: 'Bad Request', message: 'Помилка валідації', errors: err.errors.map((e) => e.message) });
    }
    next(err);
  }
};

router.put('/:id', handleUpdatePost);
router.patch('/:id', handleUpdatePost);

/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     tags:
 *       - Posts (Статті)
 *     summary: Видалити статтю
 *     description: Видаляє ресурс статті за її ID (відповідно до REST стандартів повертає 204 No Content)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID статті
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       204:
 *         description: Статтю успішно видалено (тіло відповіді відсутнє)
 *       400:
 *         description: Невалідний ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Статтю не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Bad Request', message: 'Невалідний ID статті' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: `Статтю з ID ${id} не знайдено` });
    }

    await post.destroy();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
