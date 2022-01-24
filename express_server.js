const { response } = require("express");
const express = require("express");
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