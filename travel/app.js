const express = require('express');
const expressSession = require("express-session");
const PORT = 3000;
const app = express();
const hbs = require('hbs');
const expressHbs = require('express-handlebars');
const fs = require('fs');
const functions = require('./functions');
const mysql = require("mysql2");

var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

const urlencodeParser = bodyParser.urlencoded({ extended: false });

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
app.use(express.static(__dirname + "/styles"));
app.use(express.static(__dirname + "/pictures"));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + "/views/layouts");

app.engine('hbs', expressHbs({ //встановлюємо двигун hbs (є інші двигуни, але я використовую цей) для express
    layoutsDir: 'views/layouts', //вказуємо шлях до папки з головним лейаутом
    defaultLayout: 'layout', //шлях до самого лейаута. Тіпа воно буде шукати у views/layouts файл layout.hbs
    helpers: { // сюда можна передати любі змінні, які потім можна відобразити на формі
        Auth: function (user) { //Auth потрібен для розмітки в файлі header.hbs. Могли б замість Auth написати Nadikadik і також би працювало
            if (user) {
                return new hbs.SafeString(
                    ` <a href="/signOut" class="header-button" type="submit">Sign out</a>`
                );
            } else {
                return new hbs.SafeString(
                    `
                    <a href="signin" class="header-button">SignIn</a>   
                    <a href="signup" class="header-button">SignUp</a>   
                    `
                );
            }
        },
    },
    extname: 'hbs'
}));

var secretValue = 'secret'; //слово, яке використовується для вичеслення хеша, можна любе

app.use(expressSession({
    resave: false, //якщо протягом часу існування запиту об'єкт сеансу не змінюється, то в кінці запиту і коли saveUninitialized має значення false, (все ще порожній, тому що НЕ змінений) об'єкт сеансу не буде збережений в сховище сеансів.
    saveUninitialized: false,
    secret: secretValue //слово, яке використовується для вичеслення хеша
}));

const connection = mysql.createConnection({
    host: "localhost", //хост
    user: "root", //назва користувача в базі
    password: "" //пароль до бази
});

connection.query("CREATE DATABASE IF NOT EXISTS travel_db", function (err, results) {
    if (err) console.log(err); //вивід помилок в консоль, якщо є
    else {
        console.log('Database travel_db => created');

        const connection = mysql.createConnection({
            host: "localhost", //хост
            user: "root", //назва користувача в базі
            database: "travel_db", //назва бази, яка створилася
            password: "" //пароль до бази
        });

        let sql = `create table if not exists users(
            id int primary key auto_increment,
            login varchar(255) not null,
            email varchar(255) not null,
            password varchar(255) not null
          )`; //стрічка, в яку записуємо наш запит

        connection.query(sql /*стрічка з запитом*/, function (err, results) {
            if (err) console.log(err); //вивід помилок в консоль, якщо є
            else console.log("Table users => created"); //вивід сповіщення про то, що база створена
        });

        let sql_status = `create table if not exists reserveStatus(
            id int primary key auto_increment,
            status varchar(255) not null 
        )`; //стрічка, в яку записуємо наш запит

        connection.query(sql_status /*стрічка з запитом*/, function (err, results) /*функція зворотнього виклику, в ній можемо писати любу логіку*/{
            if (err) console.log(err); //вивід помилок в консоль, якщо є
            else {
                console.log("Table reserveStatus => created");
                let sql_select_reserveStatus = `select * from reserveStatus`;  //стрічка, в яку записуємо наш запит

                connection.query(sql_select_reserveStatus, function (er, data) {
                    if (err) console.log(err); //вивід помилок в консоль, якщо є
                    else {
                        if (data.length == 0) {
                            let reserveStatus = [['Confirmed'], ['Unconfirmed']];  //масив даних, які потім будемо передавати в функцію
                            let sql_insert_reserveStatus = `INSERT INTO reserveStatus(status) VALUES ?`; //замість ? підставиться масив reserveStatus

                            connection.query(sql_insert_reserveStatus, [reserveStatus] /*саме тут (другий параметр функції) передається масив даних*/, function (error, res) {
                                if (error) console.log(error);
                                console.log("Reserve status { " + `${reserveStatus}` + "} => inserted");
                            });
                        }
                    }
                });
            }
        });

        let sql_tourType = `create table if not exists tourType(
            id int primary key auto_increment,
            type varchar(255) not null 
        )`;//стрічка, в яку записуємо наш запит
        connection.query(sql_tourType /*стрічка з запитом*/, function (err, results) {
            if (err) console.log(err);  //вивід помилок в консоль, якщо є
            else {
                console.log("Table tourType => created");
                let sql_select_tourType = `select * from tourType`;

                connection.query(sql_select_tourType, function (er, data) {
                    if (err) console.log(err);
                    else {
                        if (data.length == 0) {

                            let tourTypes = [['AllInClusive'], ['StandartTour']];  //масив даних, які потім будемо передавати в функцію
                            let sql_insert_tourTypes = `INSERT INTO tourType(type) VALUES ?`;//стрічка, в яку записуємо наш запит

                            connection.query(sql_insert_tourTypes /*стрічка з запитом*/, [tourTypes], function (error, res) {
                                if (error) console.log(error); //вивід помилок в консоль, якщо є
                                console.log("Tour types { " + `${tourTypes}` + "} => inserted");
                            });
                        }
                    }
                });
            }
        });

        let sql_roomType = `create table if not exists roomType(
            id int primary key auto_increment,
            type varchar(255) not null 
        )`;

        connection.query(sql_roomType, function (err, results) {
            if (err) console.log(err);
            else {
                console.log("Table roomType => created");

                let sql_select_roomtype = `select * from roomType`;

                connection.query(sql_select_roomtype /*стрічка з запитом*/, function (er, data) {
                    if (err) console.log(err);
                    else {
                        if (data.length == 0) {

                            let roomTypes = [['StandartRoom'], ['ComfortRoom']];
                            let sql_insert_roomTypes = `INSERT INTO roomType(type) VALUES ?`;

                            connection.query(sql_insert_roomTypes, [roomTypes], function (error, res) {
                                if (error) console.log(error);

                                console.log("Room types { " + `${roomTypes}` + "} => inserted");
                            });
                        }
                    }
                });
            }
        });

        let sql_tour = `create table if not exists tours(
            id int primary key auto_increment,
            name varchar(255) not null,
            tourType_id int,
            roomType_id int,
            FOREIGN KEY(tourType_id) REFERENCES tourType (id),
            FOREIGN KEY(roomType_id) REFERENCES roomType (id)
        )`;

        connection.query(sql_tour, function (err, results) {
            if (err) console.log(err);
            else {
                console.log("Table tours => created");

                let sql_select_tours = `select * from tours`;

                connection.query(sql_select_tours, function (er, data) {
                    if (err) console.log(err);
                    else {
                        if (data.length == 0) {

                            let tours = [
                                ['tour-1', 1, 1],
                                ['tour-2', 1, 2],
                                ['tour-3', 2, 1],
                            ];
                            let sql_insert_tours = `INSERT INTO tours(name, tourType_id, roomType_id) VALUES ?`;

                            connection.query(sql_insert_tours, [tours], function (error, res) {
                                if (error) console.log(error);

                                console.log("Tours { " + `${tours}` + "} => inserted");
                            });
                        }
                    }
                });
            }

        });

        let sql_reservation = `create table if not exists reservations(
            id int primary key auto_increment,
            user_id int,
            tour_id int,
            reserveStatus_id int,
            FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY(tour_id) REFERENCES tours (id),
            FOREIGN KEY(reserveStatus_id) REFERENCES reserveStatus (id)
        )`;
        connection.query(sql_reservation, function (err, results) {
            if (err) console.log(err);
            else console.log("Table reservations => created");
        });
    };
});

app.get("/", function (req, res) {
    res.redirect("/home"); //redirect автоматично в пошуковій стрічці вводить шлях, який ми передали ("/home") і переходить на нього
});

app.get("/home", function (req, res) {
    res.render("home.hbs", { //render відображає сторінку, без цього при переході на home буде просто біла сторінка
        title: "Home", //title - назва, яка буде відображатися у вкладці браузера
        user: req.session.user, //користувач, який зайшов, якщо він є
        flag: (req.session.user) ? true : false, //записує у flag чи авторизований користувач чи ні
        isAuth: (req.session.user)? false :true //так само тут
    });
});

app.get('/about', function (req, res) {
    res.render("about.hbs", { //render відображає сторінку, без цього при переході на home буде просто біла сторінка
        title: "About" //title - назва, яка буде відображатися у вкладці браузера
    });
});

app.get('/blog', function (req, res) {
    res.render("blog.hbs", { //render відображає сторінку, без цього при переході на home буде просто біла сторінка
        title: "Blog" //title - назва, яка буде відображатися у вкладці браузера
    });
});

app.get('/signin', function (req, res) {
    res.render("signin.hbs", { //render відображає сторінку, без цього при переході на home буде просто біла сторінка
        title: "Sign In" //title - назва, яка буде відображатися у вкладці браузера
    });
});

app.get('/signup', function (req, res) {
    res.render("signup.hbs", { //render відображає сторінку, без цього при переході на home буде просто біла сторінка
        title: "Sign Up" //title - назва, яка буде відображатися у вкладці браузера
    });
});

app.post('/reserve', function (req, res) {
    if (req.session.user) { //перевірка на то, що сесія створена і в ній є користувач, який залогінений

        console.log(req.body.id); //вивід користувача
        const connection = mysql.createConnection({
            host: "localhost", //хост
            user: "root", //назва користувача в базі
            database: "travel_db", //назва бази
            password: "" //пароль
        });

        let reservations = [[req.session.user, req.body.id,2]]; //масив даних
        let sql_insert_reservations = `INSERT INTO reservations(user_id, tour_id, reserveStatus_id) VALUES ?`; //стрічка, в яку записуємо запит

        connection.query(sql_insert_reservations /*стрічка з запитом*/, [reservations], function (error, res) {
            if (error) console.log(error); //виводимо помилки

            connection.end(); //закриваємо підключення до базою даних
        });

        res.end("operator will contact you"); // відправляємо відповідь сервера, яка буде оброблена на стороні клієнта
    } else {
        res.end("Sign in!!"); // відправляємо відповідь сервера, яка буде оброблена на стороні клієнта
    }
});

app.post('/signin', jsonParser /*потрібен для зручного доступу до даних, які надсилає форма логіну*/, function (req, res) {
    let status;

    const connection = mysql.createConnection({
        host: "localhost", //хост
        user: "root", //назва користувача в базі
        database: "travel_db", //назва бази
        password: "" //пароль
    });

    const sql = `SELECT * FROM users WHERE email=? AND password=?`; //стрічка, в яку записуємо запит
    const filter = [req.body.email, req.body.password]; //масив даних, в я записуємо дані, які прийшли з форми (завдяки jsonParser можемо легко доступится до даних)

    connection.query(sql, filter, function (err, results) {
        if (err) console.log(err); //
        if (results.length != 0) { //якщо результат, повернув нам з бази якісь стрічки, то в тіло if зайде
            status = 'SUCCESS'; // в принципі тут того непотрібно

            console.log('Set Session'); //вивід інформації в консоль сервера

            req.session.user = results[0].id; //присвоєнная сесія ід юзера, який був отриманий з бази даних
            req.session.flag = true;

            res.redirect('home'); //редірект на сторінку хом
        }
        else {
            status = 'Incorrect email or password!'; //записуємо в статус дані
            res.render('signin', { //рендеримо сторінку
                status: status //відправляємо статус
            });
        }
    });

});

app.post('/signup', jsonParser /*потрібен для зручного доступу до даних, які надсилає форма логіну*/, function (req, res) {
    var errors = functions.validate(req); //валідація даних
    let status;

    if (errors.length == 0) { //якщо валідація пройшла без помилок, то зайде в тіло if
        const connection = mysql.createConnection({
            host: "localhost", //хост
            user: "root", //назва користувача в бд
            database: "travel_db", //назва бази
            password: "" // пароль
        });

        const sql = `SELECT * FROM users WHERE email=?`; //стрічка, в яку записуємо запит до бази
        const filter = [req.body.email, req.body.password]; //масив даних, в я записуємо дані, які прийшли з форми (завдяки jsonParser можемо легко доступится до даних)

        connection.query(sql, filter, function (err, results) {
            if (err) console.log(err); //вивід помилок в консоль, якщо є

            console.log(results);
            if (results.length != 0) {
                status = 'ERROR';  //записуємо статус, в цьому випадку "error"
                errors.push("Email already used!"); //додаємо в errors помилку, що користувач з таким емаіл вже існує
                res.render("signup.hbs", { //рендеримо сторінку вхожу
                    title: "Sign Up", //встановлюємо назву вкладки в браузері
                    errors: errors //передаємо помилки в розмітку
                });
            } else {
                let user = [req.body.login, req.body.email, req.body.password]; //якщо користувач з таким емаіл не знайдеться, то записуємо його в в масив
                const sql_insert = "INSERT INTO users(login, email, password) VALUES(?, ?, ?)"; //стрічка запиту

                connection.query(sql_insert, user, function (error, data) {
                    if (error) console.log(error);//виводимо помилки в консоль
                    else console.log("User added to Database"); //вивід в консоль сервера

                    console.log('Set Session'); //вивід в консоль сервера

                    req.session.user = data.insertId; //присвоюємо користувачу ід
                    req.session.flag = true;

                    status = 'SUCCESS'; //додаємо статус
                    res.redirect('/home'); //і рендеримо сторінку
                });
            }
        });
    } else {
        status = 'ERROR'; //додаємо статус
        res.render("signup.hbs", {
            title: "Sign Up", //встановлюємо назву вкладки в браузері
            errors: errors //передаємо помилки в розмітку
        });
    }
});

app.use('/signOut', function (req, res) {
    console.log("Session delete"); //виводимо в консоль повідомлення про то, що сесія була видалена
    console.log('User id = ' + req.session.user); //виводимо ід юзера, який завершив сесію
    delete req.session.user; //видаляємо її
    req.session.flag = false;
    res.redirect('/');//редірект на слеш, який перенаправить HA home
});

app.post('/home', jsonParser, function (req, res) {
    var errors = functions.validate(req); //валідація даних
    let status; //створюємо змінну статус

    if (errors.length == 0) {
        const connection = mysql.createConnection({
            host: "localhost", //хост
            user: "root", //назва користувача в бд
            database: "travel_db", //назва бази
            password: "" //пароль до бази
        });

        const sql = `SELECT * FROM users WHERE email=?`; //записуємо в стрічку запит до бази
        const filter = [req.body.email, req.body.password]; //додаємо в масив дані, які прийшли нам з запиту

        connection.query(sql, filter, function (err, results) {
            if (err) console.log(err);//вівд в консоль помилок, якщо є

            console.log(results); //вивід результатів
            if (results.length != 0) {
                status = 'ERROR';//додаэмо статус Error
                errors.push("Email already used!");//додаємо яка саме помилка
                res.render("signup.hbs", { //рендер сторінки singup
                    title: "Sign Up", //встановлюємо назву вкладки браузера
                    errors: errors //передаємо помилки
                });
            } else {
                console.log(req.body); //ввивід в консоль тіло запиту
                let user = [req.body.login, req.body.email, req.body.password]; //в масив записуємо користувача
                const sql_insert = "INSERT INTO users(login, email, password) VALUES(?, ?, ?)"; //запис запиту в стрічку

                connection.query(sql_insert, user, function (error, data) {
                    if (error) console.log(error); //виваід помилок в консоль сервера
                    else console.log("User added to Database"); //вивід сповіщення про те, що в базу був доданий користувач

                    console.log('Set Session'); //вивід в консоль інформацію про те, що користувач зайшов

                    console.log(data);
                    req.session.user = data.insertId; //встановлення сесії ід користувача
                    req.session.flag = true;

                    status = 'SUCCESS';
                    res.redirect('/home');//redirect на сторінку home
                });
            }
        });
    } else {
        status = 'ERROR';
        res.render("signup.hbs", { //рендер сторінки входу
            title: "Sign Up", //встановлення назви вкладці
            errors: errors //вивід помилок
        });
    }
});
app.use('/home', function (req, res) {
    res.render("home", {
        user: req.session.user, //встановлення сесія користувача
        isAuth: (req.session.user)? false :true //якщо сесія існує, то ми автентифікуємо кристувача і виведимо відповідну розмітку
    });

});

app.use('/signup', function (req, res) {
    res.render("signup", { //рендер сторінки входу
        title: "Sign Up" //встановлюємо назву вкладці
    });
});

app.listen(PORT, function () {
    console.log("Servers started\nPort: " + PORT); //вивід інформації в консоль про те, що сервер стартував успішно
    connection.end(); //це потрібно для того, щою сервер працював коректно. так написано в документації
})