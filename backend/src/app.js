const express = require('express');
const fs = require('fs');
const path = require('path');

const routes = require('./routes');
const cors = require('./middlewares/cors');
const errorHandler = require('./middlewares/errorHandler');
const notFoundHandler = require('./middlewares/notFoundHandler');
const securityHeaders = require('./middlewares/securityHeaders');

const app = express();
const frontendPublicPath = path.resolve(__dirname, '../../frontend/public');
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const frontendDistIndexPath = path.join(frontendDistPath, 'index.html');

app.use(securityHeaders);
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendPublicPath));

if (fs.existsSync(frontendDistIndexPath)) {
  app.use(express.static(frontendDistPath));
}

app.use('/api/v1', routes);

if (fs.existsSync(frontendDistIndexPath)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }

    return res.sendFile(frontendDistIndexPath);
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
