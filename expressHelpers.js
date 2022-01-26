const {
  getUserById,
  getUserByEmail,
  doesUserExist,
} = require('./dbHelpers');
const {
  urlDatabase,
  userDatabase
} = require('./databases');
const { bcrypt } = require('./myBcrypt');
const { routes } = require('./configuration');

function login(req,res) {
  const { email, password } = req.body;
  const userExists = doesUserExist(email, userDatabase);
  // if user email not found
  // show specific error
  if (!userExists) {
    res.statusCode = 404;
    renderErrorPage(req,res,
      {url: routes.login,
        message: 'Retry Login'},
      'No Email found');
    return;
  }

  // gets data for accoutn with provided email
  const user = getUserByEmail(email, userDatabase);
  // checks to see if hashed password
  // onfile doesnt match user provided one
  if (!bcrypt.compareSync(password, user.password)) {
    res.statusCode = 401;
    renderErrorPage(req,res,
      {url: routes.login,
        message: 'Retry Login'},
      'Wrong Password');
    return;
  }

  // password matches email, log user in
  req.session.user_id = user.id;
  res.redirect(routes.urls);
}

function redirectDoNotOwn(req, res) {
  res.statusCode = 401;
  const redirect = {
    url: routes.urls,
    message: 'List of Your Urls'
  };

  renderErrorPage(req, res, redirect, 'You dont own this url');
}

function redirectAnonUserToError(req, res) {
  res.statusCode = 403;
  const redirect = {
    url: routes.login,
    message: 'Login Here'
  };

  renderErrorPage(req, res, redirect, 'You are not logged in');
}

function renderErrorPage(req, resp, redirect, errorMessage, page = 'error_url') {
  // Structure vars so error page can render
  // specific error
  const templateVars = {
    user: getUserById(
      req.session.user_id, userDatabase),
    redirect: redirect.url,
    redirectText: redirect.message,
    display: `${resp.statusCode} - ${errorMessage}`,
  };

  resp.render(page, templateVars);
}

function redirectToLongUrl(req, res, shortURL) {
  const longURL = urlDatabase[shortURL].longURL;
  // gets ip to track unique visitors
  const ip = req.ip;
  const isUniqueVisitor = !urlDatabase[shortURL].uniqueVisitors.includes(ip);

  urlDatabase[shortURL].totalVisits++;
  
  if (isUniqueVisitor) {
    // add IP if visitor is unique
    urlDatabase[shortURL].uniqueVisitors.push(req.ip);
  }
  res.statusCode = 302;
  res.redirect(longURL);
}

module.exports = {renderErrorPage, redirectAnonUserToError, redirectDoNotOwn, login, redirectToLongUrl};