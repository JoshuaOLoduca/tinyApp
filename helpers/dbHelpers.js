const { bcrypt, salt } = require('./bcryptHelper');

function dbHelperWrapper(userDb, urlDb) {
  // Checks to see if user owns shortUrl
  // returns true/false
  function doesUserOwn(userId, shortId) {
    // if url doesnt exist, no one owns it
    if (!urlDb[shortId]) return false;
    // if it exists and its userId matches
    // logged in user, returns true.
    // otherwise, false
    return urlDb[shortId].userID === userId;
  }

  // gets all urls owned by user
  // returns empty object or
  //         object of urls owned by user
  function getUrlsForUserID(userId) {
    const urls = {};
    for (const id in urlDb) {
      if (urlDb[id].userID === userId) {
        urls[id] = urlDb[id];
      }
    }
    return urls;
  }

  // gets user info by email
  // used to login user
  // returns userInfo or false
  function getUserByEmail(email) {
    for (const id in userDb) {
      if (userDb[id].email === email) {
        return userDb[id];
      }
    }
    return false;
  }

  function getUserById(id) {
    return userDb[id];
  }

  // returns false or userID
  function createUser(email, password) {
    const existsAlready = doesUserExist(email, userDb);
    // if any of the args empty,
    // or if they exist already
    // return false
    if (existsAlready || !email || !password) return false;

    const id = generateRandomString(12);
    userDb[id] = {
      id: id,
      email: email,
      password: bcrypt.hashSync(password, salt)
    };
    const gotCreated = email === userDb[id].email;

    // If user registered successfully
    // return their id, otherwise return false
    return gotCreated ? id : false;
  }

  // checks to see if email is already in use
  // returns true/false
  function doesUserExist(email) {
    for (const id in userDb) {
      if (userDb[id].email === email) {
        return true;
      }
    }
    return false;
  }

  // randomly return true or false
  function randomBool() {
    return Math.floor(Math.random() * 2) ? true : false;
  }

  // returns a result from 0 to, and including, num
  function randomNumberInclusive(num) {
    return Math.floor(Math.random() * (num + 1));
  }

  // returns random string of nums and chars
  // default length is 6
  // chars to be treated as case sensitive
  function generateRandomString(length = 6) {
    // turned into array
    const chars = 'abcdefgh1jklmnopqrstuvwxyz'.split('');
    // also an array
    const numbers = '0123456789'.split('');
    let randomString = '';

    for (let i = 0; i < length; i++) {
      // randomly decides if next string suffix
      // will be a char or int
      let nextIsChar = randomBool();

      if (nextIsChar) {
        // used to pick char using an index
        // that is randomly chosen
        // 0-25 = 26 index possibilities
        let charIndex = randomNumberInclusive(25);
        let upperCase = randomBool();

        if (upperCase) {
          randomString += chars[charIndex].toUpperCase();
          continue;
        }
        randomString += chars[charIndex];
        continue;
      }

      // if nextIsChar is false, append number
      // 0-9 = 10 possible index possibilities
      let numIndex = randomNumberInclusive(9);
      randomString += numbers[numIndex];
    }

    return randomString;
  }

  function addUrlToDatabase(userID, url) {
    const id = generateRandomString();

    // verifies if url starts with proper prefix
    // fixes it if not
    if (!url.includes('://')) {
      url = 'http://' + url;
    }
    
    // inserts url to our psuedo database
    urlDb[id] = {
      longURL: url,
      userID: userID,
      uniqueVisitors: [],
      totalVisits: [],
      created: Date(Date.now())

    };
    
    return id;
  }
  return {
    createUser,
    getUserById,
    getUserByEmail,
    getUrlsForUserID,
    doesUserExist,
    doesUserOwn,
    addUrlToDatabase,
    generateRandomString,
  };
}

module.exports = { dbHelperWrapper };
