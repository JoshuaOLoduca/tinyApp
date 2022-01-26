const {
  getUserById,
  getUserByEmail,
  doesUserExist,
} = require('./dbHelpers');
const {bcrypt} = require('./myBcrypt');
const {userDatabase} = require('./databases');
const {routes} = require('./configuration');

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

module.exports = {renderErrorPage, redirectAnonUserToError, redirectDoNotOwn, login}