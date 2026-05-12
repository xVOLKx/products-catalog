const sqlite3 = 
require('sqlite3').verbose();
const path = require('path');

// Создаём или открываем базу данных в файле books.db
const db = new
sqlite3.Database(path.join(__dirname, 'books.db'));

// SQL-запрос для создания таблицы (если её нет)
const createTable =  `
CREATE TABLE IF NOT EXISTS books (
id INTEGER PRIMARY KEY AUTOINCREMENT,
title TEXT NOT NULL,
author TEXT NOT NULL
    )
`;

db.run(createTable, (err) => {
    if (err) {
        console.error('Ошибка при создании таблицы:', err.message)
    } else {
        console.log('Таблица "books" готова');
    }
    db.close();
});