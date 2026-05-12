const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

// Добавить функцию защиты от XSS 
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

app.use(express.urlencoded({ extended: true }));

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

// Главная страница (форма добавления + ссылки)
app.get('/', (req, res) => {
    res.send(`
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
    `);
});

// JSON-список книг из базы данных
app.get('/books', (req, res) => {
    db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Страница редактирования товара 
app.get('/edit/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM books WHERE id = ?', [id], (err, book) => {
        if (err) {
            res.status(500).send('Ошибка базы данных');
        } else if (!book) {
            res.status(404).send('Книга не найдена');
        } else {
            res.send(`
                <h1>Редактировать книгу</h1>
                <form method="POST" action="/update-book/${book.id}">
                    <input type="text" name="title" value="${escapeHtml(book.title)}" required>
                    <br><br>
                    <input type="text" name="author" value="${book.author}" required>
                    <br><br>
                    <button type="submit">Сохранить</button>
                </form>
                <br>
                <a href="/list">← Назад</a>
            `);
        }
    });
});

// Обновление товара
app.post('/update-book/:id', (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const author = req.body.author;
    db.run('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id], function(err) {
        if (err) {
            console.error(err.message);
            
            res.status(500).send('Ошибка при обновлении');
        } else {
            console.log(`Книга id=${id} обновлён: ${title}, ${author}`);
            res.redirect('/list');
        }
    });
});

// HTML-список с кнопками удаления
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
                        <a href="/edit/${book.id}">✏️Изменить</a>
                        <a href="/delete/${book.id}" onclick="return confirm('Удалить товар?')">🗑 Удалить</a>
                        </td>
                    </tr>
                `;
            }
            res.send(`
                <h1>Список книг (SQLite)</h1>
                <table border="1">
                    <tr><th>ID</th><th>Название</th><th>Автор</th><th>Действие</th></tr>
                    ${rowsHtml}
                </table>
                <br>
                <a href="/">← На главную</a>
            `);
        }
    });
});

// Добавление книги
app.post('/add-book', (req, res) => {
    const { title, author } = req.body;
    db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при добавлении');
        } else {
            console.log(`Добавлена книга: ${title}, id = ${this.lastID}`);
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
            console.log(`Книга с id = ${id} удалена`);
            res.redirect('/list');
        }
    });
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер с SQLite запущен на http://localhost:3000');
});