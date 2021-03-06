// Used to configure express before use
// and to hold other config esk vars

const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const { userDatabase } = require('./databases');

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
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['This key is very short and super easy to crack password1234'],
}));
app.use(setUser);

function setUser(req, res, next) {
  const userId = req.session.user_id;
  req.user = userDatabase[userId];
  if (!req.user) req.user = { isEmpty: true };
  next()
}

module.exports = {routes, PORT, app};