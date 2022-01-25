const { response } = require("express");
const express = require("express");
const bodyParser = require("body-parser");
const { resolveInclude } = require("ejs");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const { use } = require("express/lib/router");
const {
  createUser,
  getUserById,
  getUserByEmail,
  generateRandomString,
  getUrlsForUserID,
  doesUserExist,
  doesUserOwn,
  addUrlToDatabase,
  } = require('./helpers');
const {urlDatabase, userDatabase} = require('./databases');
const { bcrypt, salt} = require('./myBcrypt');
const req = require("express/lib/request");
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

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['This key is very short and super easy to crack password1234'],
  maxAge: 2 * 60 * 60 * 1000 // 2 hours
}));

// needs to be before /:shortURL

appPosts();
appGets();

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function appPosts() {
  
  app.post(routes.register, (req, res) => {
    const {email, password} = req.body;
    const userId = createUser(email, password, userDatabase);

    if (!email || !password) {
      res.statusCode = 403;
      renderErrorPage(req,res,
        {url: routes.register,
        message: 'Retry Register'},
        'Email and password MUST BE FILLED');
    }

    console.log(userDatabase)
    if (userId) {
      req.body.userId = userId;
      return login(req, res);
    }
    res.statusCode = 400;
    renderErrorPage(req,res,
      {url: routes.register,
      message: 'Retry Register'},
      'User wasnt created');
  });

  app.post(routes.login, (req, res) => {
    login(req, res);
  });

  app.post(routes.logout, (req, res) => {
    req.session = null;
    res.redirect(routes.urls);
  });

  app.post(`${routes.urls}/:shortURL/delete`, (req, res) => {
    let shortURL = req.params.shortURL;
    const id = req.session.user_id;
    const user = getUserById(id, userDatabase);
    const usersUrl = urlDatabase[shortURL];

    // if user isnt logged in
    if (!user) {
      redirectAnonUserToError(req, res)
      return;
    }

    if (usersUrl.userID !== id) {
      redirectDoNotOwn(req, res);
      return;
    }
    
    delete urlDatabase[shortURL];
    res.redirect(routes.urls);
  });

  app.post(`${routes.urls}/:shortURL`, (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = req.body.longURL;

    const id = req.session.user_id;
    const user = getUserById(id, userDatabase);
    const usersUrl = urlDatabase[shortURL];

    // if user isnt logged in
    if (!user) {
      res.statusCode = 401;
      res.redirect(routes.login);
      return;
    }

    if (usersUrl.userID !== id) {
      res.statusCode = 401;
      res.redirect(routes.urls);
      return;
    }

    if (!longURL.includes('://')) {
      longURL = 'http://' + longURL;
    }

    urlDatabase[shortURL].longURL = longURL;

    res.redirect(`${routes.urls}`);
  });

  app.post(routes.urls, (req, res) => {
    let longURL = req.body.longURL;
    const userID = req.session.user_id;
    const user = getUserById(userID, userDatabase);

    if (!user) {
      res.statusCode = 401;
      redirectAnonUserToError(req, res)
      return;
    }
    const id = addUrlToDatabase(userID, longURL, urlDatabase)
    
    res.statusCode = 302;
    res.redirect(`${routes.urls}/${id}`);
  });
}

function appGets() {
  app.get(routes.login, (req, res) => {
    const userID = req.session.user_id;
    const user = getUserById(userID,userDatabase)

    if (user) return res.redirect(routes.urls)

    res.render('login');
  });

  app.get(routes.register, (req, res) => {
    const userID = req.session.user_id;
    const user = getUserById(userID,userDatabase)

    if (user) return res.redirect(routes.urls)
    
    res.render('register');
  });

  app.get(routes.urls + '/new', (req, res) => {
    const id = req.session.user_id;
    const user = getUserById(id, userDatabase);
    if (!user) {
      res.redirect(routes.login);
      return;
    }
    res.render('urls_new', {user});
  });

  app.get(routes.urls, (req, res) => {
    const id = req.session.user_id;
    const templateVars = {
      user: getUserById(id, userDatabase),
      urls: getUrlsForUserID(id, urlDatabase)
    };

    if (!id) {
      redirectAnonUserToError(req, res)
    }
  
    res.render('urls_index', templateVars);
  });
  
  app.get("/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    // console.log("Testing: ", longURL);
    
    if (urlDatabase[shortURL]) {
      const longURL = urlDatabase[shortURL].longURL;
      res.statusCode = 302;
      res.redirect(longURL);
    } else {
      res.statusCode = 404;
      renderErrorPage(req, res, {
        url: routes.urls,
        message: 'List of Your Urls'
      },
      'No Shortened Url found'
      );
    }
  
  });
  
  app.get(routes.urls + "/:shortURL", (req, res) => {
    const id = req.params.shortURL;
    const userId = req.session.user_id;
    console.log(userId);
    const doesUserOwnUrl = doesUserOwn(userId, id, urlDatabase);

    if (!userId) {
      redirectAnonUserToError(req, res)
    }

    if (!doesUserOwnUrl) {
      redirectDoNotOwn(req, res)
    }
  
    const templateVars = {
      user: getUserById(req.session.user_id, userDatabase),
      shortURL: id,
      longURL: urlDatabase[id].longURL,
      domain: req.get('host')
    };
  
    res.render('url_show',templateVars);

  });
  
  app.get(routes.main, (req, res) => {
    const userId = req.session.user_id;
    if (userId) {
      return res.redirect(routes.urls)
    }
    res.redirect(routes.login);
  });
  
  
  app.get(routes.urlsDbg, (req, res) => {
    res.json(urlDatabase);
  });

}
// ///////////////////
// HELPERS
// ///////////////////
function login(req,res) {
  const {email, password} = req.body;
  const userExists = doesUserExist(email, userDatabase);
  if (!userExists) {
    res.statusCode = 404;
    renderErrorPage(req,res,
      {url: routes.login,
      message: 'Retry Login'},
      'No Email found');
    return;
  }
  const user = getUserByEmail(email, userDatabase);
  if (!bcrypt.compareSync(password, user.password)) {
    res.statusCode = 401;
    renderErrorPage(req,res,
      {url: routes.login,
      message: 'Retry Login'},
      'Wrong Password');
    return;
  }
  req.session.user_id = user.id;
  res.redirect(routes.urls);
}

function redirectDoNotOwn(req, res) {
  res.statusCode = 401;
  renderErrorPage(req, res,
    {
      url: routes.urls,
      message: 'List of Your Urls'
    },
    'You dont own this url'
    );
}

function redirectAnonUserToError(req, res) {
  res.statusCode = 403;
  renderErrorPage(req, res,
    {
      url: routes.login,
      message: 'Login Here'
    },
    'You are not logged in'
    );
}

function renderErrorPage(req, resp, redirect, errorMessage, page = 'error_url') {
  const templateVars = {
    user: getUserById(
      req.session.user_id, userDatabase),
    redirect: redirect.url,
    redirectText: redirect.message,
    display: `${resp.statusCode} - ${errorMessage}`,
  };
  resp.render(page, templateVars);
}