/**
 * Валідація даних автора (користувача)
 * @param {object} data
 * @param {boolean} isUpdate - чи це операція оновлення (PUT)
 * @returns {string[] | null} - список помилок валідації або null, якщо дані коректні
 */
export function validateUser(data, isUpdate = false) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Тіло запиту має бути валідним JSON-обʼєктом'];
  }

  // Перевірка name
  if (!isUpdate || data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push("Поле 'name' є обов'язковим і має містити щонайменше 2 символи");
    } else if (data.name.trim().length > 100) {
      errors.push("Поле 'name' не може перевищувати 100 символів");
    }
  }

  // Перевірка address
  if (!isUpdate || data.address !== undefined) {
    if (typeof data.address !== 'string' || data.address.trim().length < 3) {
      errors.push("Поле 'address' є обов'язковим і має містити щонайменше 3 символи");
    } else if (data.address.trim().length > 255) {
      errors.push("Поле 'address' не може перевищувати 255 символів");
    }
  }

  // Перевірка username (обліковий запис)
  if (!isUpdate || data.username !== undefined) {
    if (typeof data.username !== 'string' || data.username.trim().length < 3) {
      errors.push("Поле 'username' (обліковий запис) має містити щонайменше 3 символи");
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(data.username.trim())) {
      errors.push("Поле 'username' може містити лише латинські літери, цифри, крапку, дефіс та підкреслення");
    } else if (data.username.trim().length > 50) {
      errors.push("Поле 'username' не може перевищувати 50 символів");
    }
  }

  // Перевірка password
  if (!isUpdate || data.password !== undefined) {
    if (typeof data.password !== 'string' || data.password.length < 4) {
      errors.push("Поле 'password' має містити щонайменше 4 символи");
    } else if (data.password.length > 100) {
      errors.push("Поле 'password' не може перевищувати 100 символів");
    }
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Валідація даних статті (поста)
 * @param {object} data
 * @param {boolean} isUpdate - чи це операція оновлення (PUT)
 * @returns {string[] | null} - список помилок валідації або null
 */
export function validatePost(data, isUpdate = false) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return ['Тіло запиту має бути валідним JSON-обʼєктом'];
  }

  // Перевірка user_id
  if (!isUpdate || data.user_id !== undefined) {
    const userIdNum = Number(data.user_id);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      errors.push("Поле 'user_id' має бути додатним цілим числом (ID існуючого автора)");
    }
  }

  // Перевірка topic (тема)
  if (!isUpdate || data.topic !== undefined) {
    if (typeof data.topic !== 'string' || data.topic.trim().length < 2) {
      errors.push("Поле 'topic' (тема) є обов'язковим і має містити щонайменше 2 символи");
    } else if (data.topic.trim().length > 100) {
      errors.push("Поле 'topic' не може перевищувати 100 символів");
    }
  }

  // Перевірка title (заголовок)
  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length < 2) {
      errors.push("Поле 'title' (заголовок) є обов'язковим і має містити щонайменше 2 символи");
    } else if (data.title.trim().length > 200) {
      errors.push("Поле 'title' не може перевищувати 200 символів");
    }
  }

  // Перевірка content (текст статті)
  if (!isUpdate || data.content !== undefined) {
    if (typeof data.content !== 'string' || data.content.trim().length < 5) {
      errors.push("Поле 'content' (текст статті) має містити щонайменше 5 символів");
    }
  }

  // Перевірка image_url (ілюстрація - опціонально)
  if (data.image_url !== undefined && data.image_url !== null) {
    if (typeof data.image_url !== 'string') {
      errors.push("Поле 'image_url' має бути рядком");
    } else if (data.image_url.length > 500) {
      errors.push("Поле 'image_url' не може перевищувати 500 символів");
    }
  }

  return errors.length > 0 ? errors : null;
}

/**
 * Валідація числового ID у параметрах маршруту
 * @param {string|number} id
 * @returns {number | null} - числове значення або null, якщо невалідно
 */
export function parseIdParam(id) {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

