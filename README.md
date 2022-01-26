# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

App is fully functional (except doesnt support persistant data)
## Final Product Images

!["A users URLs dashboard"](/readme_imgs/users_urls.jpg)

!["url edit and statistic page"](/readme_imgs/url_edit_page.jpg)

## Features
- Functionality 
  - Redirects short url to full url
    - Available to everyone
  - Shortens any url
    - Verifies url starts with http:// or https://
    - Only available to logged in users
  - Tracks total uses of shortened url
  - Tracks unique user uses of shortened url
  - Able to edit shortened redirect url
    - Only if user is logged in and owns shortUrl
  - Deletion of urls
    - Only if user is logged in and owns shortUrl
- User Accounts
  - Account creation (/register)
    - Password is hashed
  - Account Login
  - Dashboard of users urls
## Dependencies

- Required
  - [Node.js](https://nodejs.org/en/)
  - [Express](https://expressjs.com/)
  - [EJS](https://ejs.co/)
  - [bcryptjs](https://www.npmjs.com/package/bcryptjs)
  - [cookie-session](https://www.npmjs.com/package/cookie-session)
- Dev
  - [Chai](https://www.npmjs.com/package/chai)
  - [Mocha](https://www.npmjs.com/package/mocha)
  - [Nodemon](https://www.npmjs.com/package/nodemon)

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.