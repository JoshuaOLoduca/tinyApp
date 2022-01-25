const { response } = require("express");
const express = require("express");
const bodyParser = require("body-parser");
const { resolveInclude } = require("ejs");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

const routes = {
  main: '/',
  urls: '/urls',
  urlsDbg: '/urls.json',
  login: '/login',
  logout: '/logout',
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())

// needs to be before /:shortURL

appPosts();
appGets();

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function appPosts() {

  app.post(routes.login, (req, res) => {
    res.cookie('username', req.body.username);
    res.redirect(routes.urls);
  });

  app.post(routes.logout, (req, res) => {
    res.clearCookie('username');
    res.redirect(routes.urls);
  });

  app.post(`${routes.urls}/:shortURL/delete`, (req, res) => {
    let shortURL = req.params.shortURL;

    delete urlDatabase[shortURL];

    res.redirect(routes.urls);
  });

  app.post(`${routes.urls}/:shortURL`, (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = req.body.longURL;

    if (!longURL.includes('://')) {
      longURL = 'http://' + longURL;
    }

    urlDatabase[shortURL] = longURL;

    res.redirect(`${routes.urls}/${shortURL}`);
  });

  app.post(routes.urls, (req, res) => {
    let longURL = req.body.longURL;
    const id = generateRandomString();
    
    if (!longURL.includes('://')) {
      longURL = 'http://' + longURL;
    }
    
    urlDatabase[id] = longURL;
    
    res.statusCode = 302;
    res.redirect(`${routes.urls}/${id}`);
    // urlDatabase[Math.floor(Math.random()* 10000)] = '';
  });
}

function appGets() {
  app.get(routes.urls + '/new', (req, res) => {
    res.render('urls_new');
  });

  app.get(routes.urls, (req, res) => {
    const templateVars = {
      username: req.cookies.username,
      urls: urlDatabase
    };
  
    res.render('urls_index', templateVars);
  });
  
  app.get("/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    const longURL = urlDatabase[shortURL];
    
    if (longURL) {
      res.statusCode = 302;
      res.redirect(longURL);
    } else {
      const templateVars = {
        username: req.cookies.username,
        redirect: routes.urls,
        redirectText: 'List of Your Urls',
        display: 'No Shortened Url found',
      };
      notFoundRedirect(res, templateVars);
    }
  
  });
  
  app.get(routes.urls + "/:shortURL", (req, res) => {
  
    const id = req.params.shortURL;
  
    const templateVars = {
      username: req.cookies.username,
      shortURL: id,
      longURL: urlDatabase[id],
    };
  
    if (templateVars.longURL) {
      res.render('url_show',templateVars);
    } else {
      const templateVars = {
        username: req.cookies.username,
        redirect: routes.urls,
        redirectText: 'List of Valid Urls',
        display: 'No Url found',
      };
      notFoundRedirect(res, templateVars);
    }
  });
  
  app.get(routes.main, (req, res) => {
    res.send("Hello!");
  });
  
  
  app.get(routes.urlsDbg, (req, res) => {
    res.json(urlDatabase);
  });

}
function generateRandomString(length = 6) {
  const chars = 'abcdefgh1jklmnopqrstuvwxyz'.split('');
  const numbers = '0123456789'.split('');
  let randomString = '';

  for (let i = 0; i < length; i++) {
    let nextIsChar = randomBool();

    if (nextIsChar) {
      let charIndex = randomNumberInclusive(25);
      let upperCase = randomBool();

      if (upperCase) {
        randomString += chars[charIndex].toUpperCase();
      } else {
        randomString += chars[charIndex];
      }
      continue;
    }
    let numIndex = randomNumberInclusive(9);
    randomString += numbers[numIndex];
  }

  return randomString;

}


function notFoundRedirect(resp, templateVars, page = '404_url') {
  resp.statusCode = 404;
  resp.render(page, templateVars);
}

function randomBool() {
  return Math.floor(Math.random() * 2) ? true : false;
}

// returns a result from 0 to, and including, num
function randomNumberInclusive(num) {
  return Math.floor(Math.random() * (num + 1));
}