# Каталог товаров (Express + SQLite)

Веб-приложение для управления товарами: добавление, просмотр, редактирование, удаление (CRUD). Данные хранятся в SQLite.

## Как запустить

1. Установи [Node.js](https://nodejs.org/)
2. Склонируй репозиторий:
   ```bash
   git clone https://github.com/xVOLKx/products-catalog.git
   ```
3. Перейди в папку проекта:
   ```bash
   cd products-catalog
   ```
4. Установи зависимости:
   ```bash
   npm install express sqlite3
   ```
5. Запусти:
   ```bash
   node products-sql.js
   ``` 
6. Открой в браузере:
   ```bash
     http://localhost:3000
   ```

## 🖼️ Скриншоты

### Форма добавления товара
![Форма добавления](/public/images/screenshot-form.png)

### Список товаров с кнопками
![Список товаров](/public/images/screenshot-list.png)

### JSON-вывод всех товаров
![JSON-список](/public/images/screenshot-json.png)

## 🛠️ Технологии

- Node.js + Express
- SQLite
- HTML/CSS