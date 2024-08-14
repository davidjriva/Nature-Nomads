const { getReasonPhrase } = require('http-status-codes');
const { error } = require('console');

module.exports = (res, statusCode, data) => {
  error('Inside of sendResponse');
  const response = {
    message: getReasonPhrase(statusCode),
  };

  if (data) response.data = data;

  error(`Sending response <utils>; Status Code = ${statusCode}; response = ${response}`);
  res.status(statusCode).json(response);
};
