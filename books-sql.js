// books-sql.js
// Бэкенд для управления книгами (добавление, просмотр, редактирование, удаление)
// Технологии: Node.js, Express, SQLite

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Функция для защиты от XSS (экранирование спецсимволов)
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Разрешаем чтение данных из HTML-форм
app.use(express.urlencoded({ extended: true }));

// Отдаём статические файлы (CSS, картинки) из папки public
app.use(express.static('public'));

// Подключаем базу данных (будет файл books.db в той же папке)
const db = new sqlite3.Database(path.join(__dirname, 'books.db'));

// Создаём таблицу, если её нет
db.run(`
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL
    )
`);

// Главная страница — форма для добавления книги
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Добавить книгу</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <h1>Добавить книгу (SQLite)</h1>
            <form method="POST" action="/add-book">
                <input type="text" name="title" placeholder="Название" required>
                <br><br>
                <input type="text" name="author" placeholder="Автор" required>
                <br><br>
                <button type="submit">Добавить</button>
            </form>
            <hr>
            <a href="/books">📦 Посмотреть JSON</a>
            <br>
            <a href="/list">📋 Управление книгами (удаление)</a>
        </body>
        </html>
    `);
});

// JSON-список книг (для API)
app.get('/books', (req, res) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Страница редактирования книги (GET-запрос)
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM books WHERE id = ?', [id], (err, book) => {
        if (err) {
            res.status(500).send('Ошибка базы данных');
        } else if (!book) {
            res.status(404).send('Книга не найдена');
        } else {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Редактировать книгу</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <h1>Редактировать книгу</h1>
                    <form method="POST" action="/update-book/${book.id}">
                        <input type="text" name="title" value="${escapeHtml(book.title)}" required>
                        <br><br>
                        <input type="text" name="author" value="${escapeHtml(book.author)}" required>
                        <br><br>
                        <button type="submit">Сохранить</button>
                    </form>
                    <br>
                    <a href="/list">← Назад</a>
                </body>
                </html>
            `);
        }
    });
});

// Обработка отправки формы редактирования (POST-запрос)
app.post('/update-book/:id', (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const author = req.body.author;
    db.run('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при обновлении');
        } else {
            console.log(`Книга id=${id} обновлена: ${title}, ${author}`);
            res.redirect('/list');
        }
        });
});

// HTML-список книг с кнопками "Изменить" и "Удалить"
app.get('/list', (req, res) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
            res.status(500).send('Ошибка базы данных');
        } else {
            let rowsHtml = '';
            for (let book of rows) {
                rowsHtml += `
                    <tr>
                        <td>${book.id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>
                            <a href="/edit/${book.id}">✏️ Изменить</a>
                            <a href="/delete/${book.id}" onclick="return confirm('Удалить книгу?')">🗑 Удалить</a>
                        </td>
                    </tr>
                `;
            }
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Список книг</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <h1>Список книг (SQLite)</h1>
                    <table border="1">
                        <thead>
                            <tr><th>ID</th><th>Название</th><th>Автор</th><th>Действие</th></tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <br>
                    <a href="/">← На главную</a>
                </body>
                </html>
            `);
        }
    });
});

// Обработка добавления книги
app.post('/add-book', (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при добавлении: ' + err.message);
        } else {
            console.log(`Добавлена книга: ${title}, автор: ${author}, id = ${this.lastID}`);
            res.redirect('/');
        }
    });
});

// Удаление книги по id
app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM books WHERE id = ?', id, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при удалении');
        } else {
            console.log(`Книга с id ${id} удалена`);
            res.redirect('/list');
        }
    });
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер с SQLite для книг запущен на http://localhost:3000');
});