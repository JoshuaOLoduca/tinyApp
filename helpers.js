const { bcrypt, salt} = require('./myBcrypt');

function doesUserOwn(userId, shortId, urlDb) {
  if (!urlDb[shortId]) return false;
  return urlDb[shortId].userID === userId;
}

function getUrlsForUserID(userId, urlDb) {
  const urls = {};
  for (const id in urlDb) {
    if (urlDb[id].userID === userId) {
      urls[id] = urlDb[id];
    }
  }
  return urls;
}


function getUserByEmail(email, userDB) {
  for (const id in userDB) {
    if (userDB[id].email === email) {
      return userDB[id];
    }
  }
  return false;
}

function getUserById(id, userDb) {
  return userDb[id];
}

function createUser(email, password, userDb) {
  const existsAlready = doesUserExist(email, userDb);
  if (existsAlready || !email || !password) return false;

  const id = generateRandomString(12);
  userDb[id] = {
    id: id,
    email: email,
    password:  bcrypt.hashSync(password, salt)
  };
  const gotCreated = email === userDb[id].email;
  return gotCreated ? id : false;
}

function doesUserExist(email, userDB) {
  for (const id in userDB) {
    if (userDB[id].email === email) {
      return true;
    }
  }
  return false;
}

function randomBool() {
  return Math.floor(Math.random() * 2) ? true : false;
}

// returns a result from 0 to, and including, num
function randomNumberInclusive(num) {
  return Math.floor(Math.random() * (num + 1));
}

function generateRandomString(length = 6) {
  const chars = 'abcdefgh1jklmnopqrstuvwxyz'.split('');
  const numbers = '0123456789'.split('');
  let randomString = '';

  for (let i = 0; i < length; i++) {
    let nextIsChar = randomBool();

    if (nextIsChar) {
      let charIndex = randomNumberInclusive(25);
      let upperCase = randomBool();

      if (upperCase) {
        randomString += chars[charIndex].toUpperCase();
      } else {
        randomString += chars[charIndex];
      }
      continue;
    }
    let numIndex = randomNumberInclusive(9);
    randomString += numbers[numIndex];
  }

  return randomString;

}

function addUrlToDatabase(userID, url, urlDb) {
  const id = generateRandomString();

  if (!url.includes('://')) {
    url = 'http://' + url;
  }
  
  urlDb[id] = {
    longURL: url,
    userID: userID
  };

  return id;
}


module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  generateRandomString,
  getUrlsForUserID,
  doesUserExist,
  doesUserOwn,
  addUrlToDatabase,
  }