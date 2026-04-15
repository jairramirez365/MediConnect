const express = require('express');
const path = require('path');

const routes = require('./routes');
const cors = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const securityHeaders = require('./middlewares/securityHeaders');

const app = express();

app.use(securityHeaders);
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, '../../frontend/public')));

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
