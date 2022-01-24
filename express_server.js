const { response } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.set("view engine", "ejs")

app.get("/urls/:shortURL", (req, res) => {

  const id = req.params.shortURL

  const templateVars = {
    shortURL: id,
    longURL: urlDatabase[id],
  };

  console.log(urlDatabase[id])

  if(templateVars.longURL) {
    res.render('url_show',templateVars);
  } else {
    res.statusCode = 404;
    res.send('404 - Url Not Found');
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};

  res.render('urls_index', templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});