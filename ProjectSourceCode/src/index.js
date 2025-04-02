/**************************************************** DEPENDENCIES ****************************************************/
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());


/**************************************************** HANDLEBARS CONFIG ****************************************************/
//configuration borrowed from previous lab and altered by Julia

//configure handlebars partials
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});

// Register hbs view engine
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'resources')));

/**************************************************** DATABASE CONFIG ****************************************************/

const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
const maxRetries = 10;
let retries = 0;

db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });
/**************************************************** PAGES ****************************************************/

// Testing
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
});

module.exports = app.listen(3000);

// Register routes from lab 8

app.get('/register', (req, res) => {
  res.render('pages/register');
});

app.post('/register', async (req, res) => {
try {
  const hash = await bcrypt.hash(req.body.password, 10); 

  // check if username already exists in db
  const existingUser = await db.oneOrNone('SELECT user_id FROM users WHERE username = $1;', [req.body.username]);
  if (existingUser) {
    throw new Error('Username already exists. Please choose another one.');
  }

  await db.none(`INSERT INTO users (username, password_hash) VALUES ($1, $2);`, [req.body.username, hash]);

  res.render('pages/login', {
    message: 'Sucessfully registered. Please login.'
  })
} catch (err) {
  res.render('pages/register', {
    error: true,
    message: err.message
  })
}
});

// Render the homepage -- Julia
app.get('/', (req, res) => {
  res.render('pages/home');
})

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

// The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
})

