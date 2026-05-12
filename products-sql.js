const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { escape } = require('querystring');
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

app.use(express.static('public'));

const db = new sqlite3.Database(path.join(__dirname, 'products.db'));

db.run(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        price INTEGER NOT NULL
    )
`);

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Добавить товар</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <h1>Добавить товар (SQLite)</h1>
            <form method="POST" action="/add-product">
                <input type="text" name="title" placeholder="Название" required>
                <br><br>
                <input type="number" name="price" placeholder="Цена" required>
                <br><br>
                <button type="submit">Добавить</button>
            </form>
            <hr>
            <a href="/products">📦 Посмотреть JSON</a>
            <br>
            <a href="/list">📋 Управление товарами (удаление)</a>
        </body>
        </html>
    `);
});

app.get('/products', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
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
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
        if (err) {
            res.status(500).send('Ошибка базы данных');
        } else if (!product) {
            res.status(404).send('Товар не найден');
        } else {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Редактировать товаров</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                <h1>Редактировать товар</h1>
                <form method="POST" action="/update-product/${product.id}">
                    <input type="text" name="title" value="${escapeHtml(product.title)}" required>
                    <br><br>
                    <input type="number" name="price" value="${product.price}" required>
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

// Обновление товара
app.post('/update-product/:id', (req, res) => {
    const id = req.params.id;
    const title = req.body.title;
    const price = Number(req.body.price);
    db.run('UPDATE products SET title = ?, price = ? WHERE id = ?', [title, price, id], function(err) {
        if (err) {
            console.error(err.message);
            
            res.status(500).send('Ошибка при обновлении');
        } else {
            console.log(`Товар id=${id} обновлён: ${title}, ${price}`);
            res.redirect('/list');
        }
    });
});

app.get('/list', (req, res) => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (err) {
            res.status(500).send('Ошибка базы данных');
        } else {
            let rowsHtml = '';
            for (let product of rows) {
                rowsHtml += `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.title}</td>
                        <td>${product.price}</td>
                        <td>
                        <a href="/edit/${product.id}">✏️ Изменить</a>
                        <a href="/delete/${product.id}" onclick="return confirm('Удалить товар?')">🗑 Удалить</a>
                        </td>
                    </tr>
                `;
            }
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Список товаров</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <h1>Список товаров (SQLite)</h1>
                    <table border="1">
                        <thead>
                            <tr><th>ID</th><th>Название</th><th>Цена</th><th>Действие</th></tr>
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

app.post('/add-product', (req, res) => {
    const title = req.body.title;
    const price = Number(req.body.price);
    db.run('INSERT INTO products (title, price) VALUES (?, ?)', [title, price], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при добавлении' + err.message);
        } else {
            console.log(`Добавлен товар: ${title}, цена: ${price}, id = ${this.lastID}`);
            res.redirect('/');
        }
    });
});

app.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM products WHERE id = ?', id, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Ошибка при удалении');
        } else {
            console.log(`Товар с id ${id} удалён`);
            res.redirect('/list');
        }
    });
});

app.listen(3000, () => {
    console.log('Сервер с SQLite запущен на http://localhost:3000');
});