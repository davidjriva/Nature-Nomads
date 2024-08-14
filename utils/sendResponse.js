const { getReasonPhrase } = require('http-status-codes');
const { error } = require('console');

module.exports = (res, statusCode, data) => {
  const response = {
    message: getReasonPhrase(statusCode),
  };

  if (data) response.data = data;

  res.status(statusCode).json(response);
};
