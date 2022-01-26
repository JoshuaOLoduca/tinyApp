const {bcrypt, salt} = require('./helpers/bcryptHelper');

// Used to hold our psuedo databases for the project

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    uniqueVisitors: [],
    totalVisits: [],
    created: Date(Date.now())
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    uniqueVisitors: [],
    totalVisits: [],
    created: Date(Date.now())
  }
};

const userDatabase = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user@example.com",
    password: bcrypt.hashSync("asd", salt),
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", salt)
  }
};

module.exports = {urlDatabase, userDatabase};