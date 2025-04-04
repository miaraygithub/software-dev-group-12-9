// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
app.use(bodyParser.json());

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use('/js', express.static(__dirname + '/src/resources/js'));
app.use('/js', express.static(path.join(__dirname, 'resources', 'js')));
app.use(bodyParser.json());
// set Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
  host: 'db',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// db test
db.connect()
  .then(obj => {
    // Can check the server version here (pg-promise v10.1.0+):
    console.log('Database connection successful');
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR', error.message || error);
  });

// -------------------------------------  ROUTES  ---------------------------------------

// =========== / Route ===========
app.get('/', (req, res) => {
  res.render('pages/home')
})

// =========== /login Route ===========
// Render the login page -- Jessie
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// TODO: Finish POST login
// app.post('login', async(req, res) => {
//   try {

//   } catch {

//   }
// })

// =========== /logout Route ===========
app.get('/logout', (req, res) => {
  res.render('pages/logout');
});

// =========== /events Route ===========
app.get('/events', async (req, res) => {
  var query = `SELECT * FROM events`;
  try {
    const response = await db.any(query);
    console.log(response);
  } catch (err) {
    console.error('Error fetching data: ', err);
    res.status(400).json({ error: err.message});
  }
});

// =========== /search Route ===========
app.get("/search", async (req, res) => {
  try {
    // const results = await db.any(`SELECT * FROM Users
    //   JOIN Clubs
    //   JOIN Events 
    //   WHERE Users.username = keyword
    //   OR Users.firstname = keyword
    //   OR Users.lastname = keyword
    //   OR Users.fistname + ' ' + lastname = keyword
    //   AND Clubs.clubname = keyword
    //   AND Events.eventName = keyword;`, [req.body.keyword]);

    res.render('pages/search-results', {
      results: results
    });
  }
  catch (err) {
    res.render('pages/search-results', {
      results: [],
      error: true,
      message: err.message
    });
  }
});

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
})