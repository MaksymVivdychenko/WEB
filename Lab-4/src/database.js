import { Sequelize, DataTypes } from 'sequelize';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '..', 'lab4.db');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: false, // вимикаємо детальний SQL лог для чистоти консолі
});

// Модель User (Автори)
export const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'name' є обов'язковим" },
      len: { args: [2, 100], msg: "Поле 'name' має містити від 2 до 100 символів" },
    },
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'address' є обов'язковим" },
      len: { args: [3, 255], msg: "Поле 'address' має містити від 3 до 255 символів" },
    },
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_username',
      msg: 'Користувач із таким логіном (username) вже існує',
    },
    validate: {
      notNull: { msg: "Поле 'username' є обов'язковим" },
      len: { args: [3, 50], msg: "Поле 'username' має містити від 3 до 50 символів" },
      is: {
        args: /^[a-zA-Z0-9_.-]+$/,
        msg: "Поле 'username' може містити лише латинські літери, цифри, крапку, дефіс та підкреслення",
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'password' є обов'язковим" },
      len: { args: [4, 100], msg: "Поле 'password' має містити від 4 до 100 символів" },
    },
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// Модель Post (Статті)
export const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    validate: {
      notNull: { msg: "Поле 'user_id' є обов'язковим" },
      isInt: { msg: "Поле 'user_id' має бути цілим числом" },
    },
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'topic' (тема) є обов'язковим" },
      len: { args: [2, 100], msg: "Поле 'topic' має містити від 2 до 100 символів" },
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'title' (заголовок) є обов'язковим" },
      len: { args: [2, 200], msg: "Поле 'title' має містити від 2 до 200 символів" },
    },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notNull: { msg: "Поле 'content' (текст статті) є обов'язковим" },
      len: { args: [5, 10000], msg: "Поле 'content' має містити щонайменше 5 символів" },
    },
  },
  image_url: {
    type: DataTypes.STRING(500),
    defaultValue: '',
  },
}, {
  tableName: 'posts',
  timestamps: true,
});

// Асоціації між моделями (1:N)
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

// Ініціалізація та наповнення тестовими даними
export async function initDatabase() {
  await sequelize.sync();

  const count = await User.count();
  if (count === 0) {
    const user1 = await User.create({
      name: 'Вівдиченко Максим Сергійович',
      address: 'Київ, вул. Політехнічна, 16',
      username: 'm_vivdychenko',
      password: 'Pass123_Secure',
    });

    const user2 = await User.create({
      name: 'Сергієнко Олена Іванівна',
      address: 'Київ, просп. Берестейський, 37',
      username: 'o_serhienko',
      password: 'AuthorPass456',
    });

    await Post.create({
      user_id: user1.id,
      topic: 'Web-технології',
      title: 'Архітектура REST API на Node.js та Express з ORM Sequelize',
      content: 'Sequelize надає потужний обʼєктно-реляційний рівень поверх реляційних БД, що виключає необхідність написання сирого SQL.',
      image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    });

    await Post.create({
      user_id: user1.id,
      topic: 'Бази даних',
      title: 'Робота з SQLite через Sequelize ORM',
      content: 'Декларативні моделі, валідація на рівні схеми та асоціації спрощують підтримку коду.',
      image_url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
    });

    await Post.create({
      user_id: user2.id,
      topic: 'Інформаційна безпека',
      title: 'Основи захисту паролів та облікових записів',
      content: 'Правильна валідація даних на рівні API та ORM запобігає більшості типових вразливостей.',
      image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3',
    });

    console.log('✅ База даних SQLite успішно ініціалізована через Sequelize ORM та наповнена тестовими записами.');
  }
}
