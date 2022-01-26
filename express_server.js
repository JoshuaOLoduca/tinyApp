const {
  createUser,
  getUserById,
  getUrlsForUserID,
  doesUserOwn,
  addUrlToDatabase,
} = require('./dbHelpers');

const {
  renderErrorPage,
  redirectAnonUserToError,
  redirectDoNotOwn, 
  login
} = require('./expressHelpers');

const {
  urlDatabase,
  userDatabase
} = require('./databases');

const {
  routes,
  app,
  PORT
} = require('./configuration');

// needs to be before /:shortURL

routesAccountManagement()
routesUrlManagement()
routesMainPurpose()


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function routesMainPurpose() {

  app.get(routes.main, (req, res) => {
    const userId = req.session.user_id;
    if (userId) {
      return res.redirect(routes.urls);
    }
    res.redirect(routes.login);
  });

  app.get("/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    
    if (urlDatabase[shortURL]) {
      const longURL = urlDatabase[shortURL].longURL;
      const ip = req.ip;
      const isUniqueVisitor = !urlDatabase[shortURL].uniqueVisitors.includes(ip);

      urlDatabase[shortURL].totalVisits++;
      
      if (isUniqueVisitor) {
        urlDatabase[shortURL].uniqueVisitors.push(req.ip);
      }
      res.statusCode = 302;
      res.redirect(longURL);
      return;
    }
    res.statusCode = 404;
    renderErrorPage(req, res, {
      url: routes.urls,
      message: 'List of Your Urls'
    },
    'No Shortened Url found'
    );
  
  });
  
  app.get(routes.urlsDbg, (req, res) => {
    res.json(urlDatabase);
  });

}

function routesAccountManagement() {

  // Register
  app.get(routes.register, (req, res) => {
    const userID = req.session.user_id;
    const user = getUserById(userID,userDatabase);

    if (user) return res.redirect(routes.urls);
    
    res.render('register');
  });
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

  // Login
  app.get(routes.login, (req, res) => {
    const userID = req.session.user_id;
    const user = getUserById(userID,userDatabase);

    if (user) return res.redirect(routes.urls);

    res.render('login');
  });
  app.post(routes.login, (req, res) => {
    login(req, res);
  });

  // Logout
  app.post(routes.logout, (req, res) => {
    req.session = null;
    res.redirect(routes.urls);
  });
};

function routesUrlManagement() {

  app.get(routes.urls + '/new', (req, res) => {
    const id = req.session.user_id;
    const user = getUserById(id, userDatabase);
    if (!user) {
      res.redirect(routes.login);
      return;
    }
    res.render('urls_new', {user});
  });

  app.post(`${routes.urls}/:shortURL/delete`, (req, res) => {
    let shortURL = req.params.shortURL;
    const id = req.session.user_id;
    const user = getUserById(id, userDatabase);
    const usersUrl = urlDatabase[shortURL];

    // if user isnt logged in
    if (!user) {
      redirectAnonUserToError(req, res);
      return;
    }

    if (usersUrl.userID !== id) {
      redirectDoNotOwn(req, res);
      return;
    }
    
    delete urlDatabase[shortURL];
    res.redirect(routes.urls);
  });

  app.get(routes.urls + "/:shortURL", (req, res) => {
    const id = req.params.shortURL;
    const userId = req.session.user_id;
    const doesUserOwnUrl = doesUserOwn(userId, id, urlDatabase);

    if (!userId) {
      redirectAnonUserToError(req, res);
    }

    if (!doesUserOwnUrl) {
      redirectDoNotOwn(req, res);
    }
  
    const templateVars = {
      user: getUserById(req.session.user_id, userDatabase),
      shortURL: id,
      urlData: urlDatabase[id],
      domain: req.get('host')
    };
  
    res.render('url_show',templateVars);

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

  app.get(routes.urls, (req, res) => {
    const id = req.session.user_id;
    const templateVars = {
      user: getUserById(id, userDatabase),
      urls: getUrlsForUserID(id, urlDatabase)
    };

    if (!id) {
      redirectAnonUserToError(req, res);
    }
  
    res.render('urls_index', templateVars);
  });
  app.post(routes.urls, (req, res) => {
    let longURL = req.body.longURL;
    const userID = req.session.user_id;
    const user = getUserById(userID, userDatabase);

    if (!user) {
      res.statusCode = 401;
      redirectAnonUserToError(req, res);
      return;
    }
    const id = addUrlToDatabase(userID, longURL, urlDatabase);
    
    res.statusCode = 302;
    res.redirect(`${routes.urls}/${id}`);
  });
}