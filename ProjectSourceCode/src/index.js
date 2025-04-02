/**************************************************** DEPENDENCIES ****************************************************/
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs'); //  To hash passwords

const app = express();
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
app.use(bodyParser.json());

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

//Render the homepage -- Julia
app.get('/', (req, res) => {
  res.render('pages/home');
});

// Render the login page -- Jessie
app.get('/login', (req, res) => {
  res.render('pages/login');
});

// TODO: Finish POST login
app.post('/login', async(req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const query = 'select * from users where users.userName = $1 LIMIT 1';
    const values = [username];
  
    const user = await db.oneOrNone(query, values);
    console.log(user);
    
    if (!user) {
      return res.redirect('/register');
    }

    // check if password from request matches with password in DB
    const match = await bcrypt.compare(password, user.userPassword);
    if (!match) {
      return res.render('pages/login', {message: 'Incorrect username or password'});
    }

    req.session.user = user;
    req.session.save();
    res.redirect('/home');
  } catch (err) {
    console.log('Login failed.');
    res.status(400).json({ error: err.message});
    res.render('pages/login', {message: 'Login failed.'});
  }
})

app.get('/logout', (req, res) => {
  res.render('pages/logout');
});

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

//The app simply closes if it isn't listening for anything so this is load bearing. -- Julia
const port = 3000
app.listen(port, () => {
  console.log(`Buff's Bulletin listening on port ${port}`)
})