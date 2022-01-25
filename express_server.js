const { response } = require("express");
const express = require("express");
const bodyParser = require("body-parser");
const { resolveInclude } = require("ejs");
const cookieParser = require('cookie-parser');
const { use } = require("express/lib/router");
const app = express();
const PORT = 8080; // default port 8080

const routes = {
  main: '/',
  urls: '/urls',
  urlsDbg: '/urls.json',
  login: '/login',
  logout: '/logout',
  register: '/register',
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
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
  
  app.post(routes.register, (req, res) => {
    const {email, password} = req.body;
    const userId = createUser(email, password);

    if (userId) {
      req.body.userId = userId;
      return login(req, res);
    }
    res.statusCode = 400;
    res.json({err: 'User wasnt created'})
  });

  app.post(routes.login, (req, res) => {
    login(req, res);
  });

  const login = (req,res) => {
    res.cookie('user_id', req.body.userId);
    res.redirect(routes.urls);
  };

  app.post(routes.logout, (req, res) => {
    res.clearCookie('user_id');
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
  app.get(routes.register, (req, res) => {
    const templateVars = {
    };
    res.render('register');
  });

  app.get(routes.urls + '/new', (req, res) => {
    res.render('urls_new');
  });

  app.get(routes.urls, (req, res) => {
    const templateVars = {
      user: getUser(req.cookies.user_id),
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
        user: getUser(req.cookies.user_id),
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
      user: getUser(req.cookies.user_id),
      shortURL: id,
      longURL: urlDatabase[id],
    };
  
    if (templateVars.longURL) {
      res.render('url_show',templateVars);
    } else {
      const templateVars = {
        user: getUser(req.cookies.user_id),
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
// ///////////////////
// HELPERS
// ///////////////////
function getUser(id){
  return userDatabase[id];
}

function createUser(email, password) {
  const existsAlready = doesUserExist(email, userDatabase)
  if (existsAlready || !email || !password) return false;

  const id = generateRandomString(12)
  userDatabase[id] = {
    id: id,
    email: email,
    password: password
  }
  const gotCreated = email === userDatabase[id].email;
  return gotCreated ? id : false;
};

function doesUserExist(email, userDB) {
  for (const id in userDB) {
      if (userDB[id].email === email) {
        return true;
      }
  }
  return false;
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