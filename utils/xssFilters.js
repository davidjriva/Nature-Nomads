const xssFilters = require("xss-filters");

// Middleware to sanitize user inputs
const xssSanitizer = (req, res, next) => {
  // Sanitize req.body
  if (req.body) {
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        req.body[key] = xssFilters.inHTMLData(req.body[key]);
      }
    }
  }

  // Sanitize req.query
  if (req.query) {
    for (const key in req.query) {
      if (req.query.hasOwnProperty(key)) {
        req.query[key] = xssFilters.inHTMLData(req.query[key]);
      }
    }
  }

  // Sanitize req.params
  if (req.params) {
    for (const key in req.params) {
      if (req.params.hasOwnProperty(key)) {
        req.params[key] = xssFilters.inHTMLData(req.params[key]);
      }
    }
  }

  next();
};

module.exports = xssSanitizer;
