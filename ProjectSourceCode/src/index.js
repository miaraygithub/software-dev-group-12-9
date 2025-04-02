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
})

//Render the Events page. 
app.get('/events', async (req, res) => {
  var query = `SELECT * FROM events`;
  try {
    const response = await db.any(query);
    res.status(200).json(response);
    res.render('pages/events');
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