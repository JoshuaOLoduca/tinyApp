const { response } = require("express");
const express = require("express");
const bodyParser = require("body-parser");
const { resolveInclude } = require("ejs");
const app = express();
const PORT = 8080; // default port 8080

const routes = {
  main: '/',
  urls: '/urls',
  urls_dbg: '/urls.json',
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({extended: true}));

// needs to be before /:shortURL
app.get(routes.urls + '/new', (req, res) => {
  res.render('urls_new');
});

app.post(routes.urls, (req, res) => {
  const longURL = req.body.longURL;  // Log the POST request body to the console
  const id = generateRandomString();
  urlDatabase[id] = longURL;

  res.send("Ok");
  // urlDatabase[Math.floor(Math.random()* 10000)] = '';
});

app.get(routes.urls + "/:shortURL", (req, res) => {

  const id = req.params.shortURL

  const templateVars = {
    shortURL: id,
    longURL: urlDatabase[id],
  };

  if(templateVars.longURL) {
    res.render('url_show',templateVars);
  } else {
    const templateVars = {
      redirect: routes.urls,
      display: 'No Url found',
    };
    res.statusCode = 404;
    res.render('404_url', templateVars)
  }
});

app.get(routes.main, (req, res) => {
  res.send("Hello!");
});

app.get(routes.urls, (req, res) => {
  const templateVars = {urls: urlDatabase};

  res.render('urls_index', templateVars);
});

app.get(routes.urls_dbg, (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString(length = 6) {
  const chars = 'abcdefgh1jklmnopqrstuvwxyz'.split('');
  const numbers = '0123456789'.split('');
  let randomString = '';

  for(let i = 0; i < length; i++) {
    let nextIsChar = randomBool()

    if (nextIsChar) {
      let charIndex = randomNumberInclusive(25);
      let upperCase = randomBool();

      if (upperCase) {
        randomString += chars[charIndex].toUpperCase();
      } else {
        randomString += chars[charIndex]
      }
      continue;
    }
    let numIndex = randomNumberInclusive(9);
    randomString += numbers[numIndex];
  }

  return randomString;

}

function randomBool() {
  return Math.floor(Math.random() * 2) ? true : false;
}

// returns a result from 0 to, and including, num
function randomNumberInclusive(num) {
  return Math.floor(Math.random() * (num + 1))
}