const {
  urlDatabase,
  userDatabase
} = require('../databases');

const { dbHelperWrapper } = require('./dbHelpers');
const {
  getUserById,
  getUserByEmail,
  doesUserExist,
  generateRandomString,
} = dbHelperWrapper(userDatabase, urlDatabase);

const { bcrypt } = require('./bcryptHelper');
const { routes } = require('../configuration');

function login(req,res) {
  const { email, password } = req.body;
  const userExists = doesUserExist(email);
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
  const user = getUserByEmail(email);
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
    user: req.user,
    redirect: redirect.url,
    redirectText: redirect.message,
    display: `${resp.statusCode} - ${errorMessage}`,
  };

  resp.render(page, templateVars);
}

function redirectToLongUrl(req, res, shortURL) {
  const longURL = urlDatabase[shortURL].longURL;
  
  // manages users unique id
  giveUniqueID(req);
  const uid = req.session.UID;

  // checks to see if user has been tracked as unique visitor
  const isUniqueVisitor = !urlDatabase[shortURL].uniqueVisitors.includes(uid);

  // add use to database
  urlDatabase[shortURL].totalVisits.push({
    id: uid,
    date: Date(Date.now()),
  });
  
  if (isUniqueVisitor) {
    // add IP if visitor is unique
    urlDatabase[shortURL].uniqueVisitors.push(uid);
  }
  res.statusCode = 302;
  res.redirect(longURL);
}

// gives user "unique" id if they dont have it
function giveUniqueID(req) {
  const uid = req.session.UID;
  // if they have it, return
  if (uid) return;

  // if not, set it
  // random string variation for length of 12 is
  // 3.2262668e+21
  req.session.UID = generateRandomString(12);
}

module.exports = {renderErrorPage, redirectAnonUserToError, redirectDoNotOwn, login, redirectToLongUrl};