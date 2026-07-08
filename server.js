const express = require('express');
const path = require('path');
const session = require('express-session');
const LokiStore = require('connect-loki')(session);
const cors = require('cors');

const routes = require('./routes');

class App {
  constructor() {
    this.express = express();
    this.isDev = process.env.NODE_ENV !== 'Production';

    this.middlewares();
    this.routes();
    this.views();
  }

  middlewares() {
    this.express.use(
      express.json({
        limit: '10000kb',
      }),
    );
    this.express.use(cors());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(
      session({
        name: 'root',
        store: new LokiStore({
          path: path.resolve(__dirname, 'tmp', 'sessions.db'),
        }),
        secret: process.env.SESSION_KEY,
        resave: true,
        saveUninitialized: true,
      }),
    );
  }

  routes() {
    this.express.use(routes);
  }

  views() {}
}

module.exports = new App().express;
