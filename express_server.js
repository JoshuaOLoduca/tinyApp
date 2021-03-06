const {
  urlDatabase,
  userDatabase
} = require('./databases');

const { dbHelperWrapper } = require('./helpers/dbHelpers');
const {
  createUser,
  getUserById,
  getUrlsForUserID,
  doesUserOwn,
  addUrlToDatabase,
  doesUserExist,
} = dbHelperWrapper(userDatabase, urlDatabase);

const {
  renderErrorPage,
  redirectAnonUserToError,
  redirectDoNotOwn,
  login,
  redirectToLongUrl,
} = require('./helpers/expressHelpers');

const {
  routes,
  app,
  PORT
} = require('./configuration');

routesAccountManagement();
routesUrlManagement();
routesMainPurpose();

function routesMainPurpose() {

  // "/"
  app.get(routes.main, (req, res) => {
    const user = req.user;

    // If logged in, direct to users URLs
    if (!user.isEmpty) {
      return res.redirect(routes.urls);
    }

    // Otherwise, direct user to login
    res.redirect(routes.login);
  });
  
  // "/urls.json"
  // Could be used as an API polling endpoint
  app.get(routes.urlsDbg, (req, res) => {
    res.json(urlDatabase);
  });

  // Must be last
  // Directs user to longUrl of shortUrl
  app.get("/:shortURL", (req, res) => {
    const shortURL = req.params.shortURL;
    
    // If shortened url exists, direct User to long URL
    if (urlDatabase[shortURL]) {
      redirectToLongUrl(req, res, shortURL);
      return;
    }

    // Redirect to 404 if shortUrl doesnt exist
    res.statusCode = 404;
    renderErrorPage(req, res, {
      url: routes.urls,
      message: 'List of Your Urls'
    },
    'No Shortened Url found'
    );
  });

}

function routesAccountManagement() {

  // '/register'
  // Renders page for user to register
  app.get(routes.register, (req, res) => {
    const user = req.user;

    // If user is logged in, redirect to their urls
    if (!user.isEmpty) return res.redirect(routes.urls);
    
    res.render('register');
  });

  // Handles data sent from register page
  app.post(routes.register, (req, res) => {
    const {email, password} = req.body;

    // If user bypasses front end and tries to register without email or password, redirect them to an error page
    if (!email || !password) {
      res.statusCode = 403;
      renderErrorPage(req,res,
        {url: routes.register,
          message: 'Retry Register'},
        'Email and password MUST BE FILLED');
      return;
    }
    const userExists = doesUserExist(email);

    if (userExists) {
      res.statusCode = 401;
      renderErrorPage(req,res,
        {url: routes.register,
          message: 'Retry Register'},
        'Email already in use');
      return;
    }

    // Tries to create account for user.
    // returns userID if successful
    // False if not
    const userId = createUser(email, password);

    if (userId) {
      req.body.userId = userId;
      login(req, res);
      return;
    }
  });

  // '/login'
  // Login
  app.get(routes.login, (req, res) => {
    const user = req.user;

    // If user is logged in, redirect to their urls
    if (!user.isEmpty) return res.redirect(routes.urls);

    // Otherwise, show login page
    res.render('login');
  });
  // handles user login data sent from client.
  // Verifies if their credentials pass or not
  app.post(routes.login, (req, res) => {
    login(req, res);
  });

  // Logout
  app.post(routes.logout, (req, res) => {
    // Deletes session cookie
    req.session.user_id = null;
    res.redirect(routes.urls);
  });
}

function routesUrlManagement() {

  // '/urls/new'
  // lets user create new shortened url
  app.get(routes.urls + '/new', (req, res) => {
    const user = req.user;
    
    // If user not logged in, redirect to login page
    if (user.isEmpty) {
      res.redirect(routes.login);
      return;
    }
    // Otherwise, show url creation page
    res.render('urls_new', {user});
  });

  // '/urls/{shortUrlID}/delete'
  // Handles deletion of users short url
  app.delete(`${routes.urls}/:shortURL`, (req, res) => {
    let shortURL = req.params.shortURL;
    const user = req.user;
    const id = user.id;
    const usersUrl = urlDatabase[shortURL];

    // if user isnt logged in,
    // Redirect to error page of said issue
    if (user.isEmpty) {
      redirectAnonUserToError(req, res);
      return;
    }

    // if user IS logged in and doesnt own
    // the shortUrl, show error
    if (usersUrl.userID !== id) {
      redirectDoNotOwn(req, res);
      return;
    }
    
    // Delete shortUrl from database
    // and redirect to their urls
    delete urlDatabase[shortURL];
    res.redirect(routes.urls);
  });

  // /urls/{shortUrlID}
  // Shows edit/stat page for shortUrl they own
  app.get(routes.urls + "/:shortURL", (req, res) => {
    const id = req.params.shortURL;
    const userId = req.user.id;
    const doesUserOwnUrl = doesUserOwn(userId, id);

    // If user isnt logged in,
    // Show them specific error
    if (!userId) {
      redirectAnonUserToError(req, res);
      return;
    }

    // If user doesnt own shortUrl,
    // show specific error
    if (!doesUserOwnUrl) {
      redirectDoNotOwn(req, res);
      return;
    }
  
    // Get data for edit/stat page
    const templateVars = {
      user: getUserById(req.session.user_id),
      shortURL: id,
      urlData: urlDatabase[id],
      domain: req.get('host')
    };
  
    // show user edit/stat page.
    res.render('url_show',templateVars);

  });
  // '/urls/{shortURLID}'
  // Lets user update longURL of shortUrl
  app.put(`${routes.urls}/:shortURL`, (req, res) => {
    let shortURL = req.params.shortURL;
    let longURL = req.body.longURL;

    const user = req.user;
    const id = user.id;
    const usersUrl = urlDatabase[shortURL];

    // If user isnt logged in,
    // Show them specific error
    if (user.isEmpty) {
      redirectAnonUserToError(req, res);
      return;
    }

    // If user doesnt own shortUrl,
    // show specific error
    if (usersUrl.userID !== id) {
      redirectDoNotOwn(req, res);
      return;
    }

    // Validates url
    if (!longURL.includes('://')) {
      longURL = 'http://' + longURL;
    }

    // updates database
    urlDatabase[shortURL].longURL = longURL;

    // redirect to their urls
    res.redirect(`${routes.urls}`);
  });

  // /urls
  // shows urls that belong to logged in user
  app.get(routes.urls, (req, res) => {
    const id = req.user.id;
    // If no one is logged in,
    // show specific error
    if (!id) {
      redirectAnonUserToError(req, res);
      return;
    }

    const templateVars = {
      user: req.user,
      urls: getUrlsForUserID(id)
    };
    res.render('urls_index', templateVars);
  });
  // '/urls'
  // Addes Long Url as Short Url to users URLs
  app.post(routes.urls, (req, res) => {
    let longURL = req.body.longURL;
    const user = req.user;
    const userID = user.id;
    // If user isnt logged in,
    // show specific error
    if (user.isEmpty) {
      redirectAnonUserToError(req, res);
      return;
    }

    // add url to database and get its,
    // id in return
    const id = addUrlToDatabase(userID, longURL);
    
    // redirect to url edit/stat page
    res.statusCode = 302;
    res.redirect(`${routes.urls}/${id}`);
  });
}

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});