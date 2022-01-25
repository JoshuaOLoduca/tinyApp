const { assert } = require('chai');

const {
  createUser,
  getUserById,
  getUserByEmail,
  getUrlsForUserID,
  doesUserExist,
  doesUserOwn,
  } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testUrls = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID"
  },
  asdw23: {
    longURL: "https://www.youtube.com",
    userID: "user2RandomID"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.deepEqual(user, testUsers[expectedUserID]);
  });
  
  it('should return false with invalid email', function() {
    const user = getUserByEmail("doesntExist@example.com", testUsers)
    assert.equal(user, false);
  });
});

describe('createUser', function() {
  it('should return userId String if user was inserted into database', function() {
    const gotCreated = createUser("fakeUser@example.com", 'password', testUsers)
    assert.isString(gotCreated);
  });

  it('should return a false if user is already registered', function() {
    const gotCreated = createUser("fakeUser@example.com", 'password', testUsers)
    assert.equal(gotCreated, false);
  });

  it('should return a false if an arg are empty', function() {
    const noEmail = createUser("", 'password', testUsers)
    const noPassword = createUser("fakeUser@example.com", '', testUsers)

    assert.equal(noEmail, false);
    assert.equal(noPassword, false);
  });
});

describe('getUrlsForUserID', function() {
  it('should only return shortened Urls that belong to user', function() {
    const usersUrlsUser1 = {
      b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "userRandomID"
      },
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "userRandomID"
      }
    };
    const getUrlsUser1 = getUrlsForUserID('userRandomID', testUrls)

    const usersUrlsUser2 = {
      asdw23: {
        longURL: "https://www.youtube.com",
        userID: "user2RandomID"
      }
    };
    const getUrlsUser2 = getUrlsForUserID('user2RandomID', testUrls)

    assert.deepEqual(usersUrlsUser1, getUrlsUser1);
    assert.deepEqual(usersUrlsUser2, getUrlsUser2);
  });
  
  it('should return empty object if user has no URLS', function() {
    const usersUrlsUser1 = {};
    const getUrlsUser1 = getUrlsForUserID('userRanddfdomID', testUrls)

    assert.deepEqual(usersUrlsUser1, getUrlsUser1);
  });
});

describe('doesUserExist', function() {
  it('should return true if users email is in database', function() {
    const userExists = doesUserExist('user@example.com', testUsers)
    assert.equal(userExists, true);
  });

  it('should return false if users email is NOT in database', function() {
    const userExists = doesUserExist('aFakeEmail@fake.com', testUsers)
    assert.equal(userExists, false);
  });
});

describe('getUserById', function() {
  it('should return user details by their ID', function() {
    const expectedUser = {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    };
    const user = getUserById('userRandomID', testUsers)
    assert.deepEqual(user, expectedUser);
  });

  it('should return undefined if user doesnt exist', function() {
    const user = getUserById('NonexistantID', testUsers)
    assert.equal(user, undefined);
  });
});

describe('doesUserOwn', function() {
  it('should return true if shortUrl belongs to userID', function() {
    const userID = 'userRandomID';
    const shortID = 'i3BoGr';
    const doesOwn = doesUserOwn(userID, shortID, testUrls)
    assert.equal(doesOwn, true);
  });

  it('should return false if shortUrl DOESNT belong to userID', function() {
    const userID = 'user2RandomID';
    const shortID = 'i3BoGr';
    const doesOwn = doesUserOwn(userID, shortID, testUrls)
    assert.equal(doesOwn, false);
  });
});