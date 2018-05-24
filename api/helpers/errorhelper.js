"use strict";

const {
  ServerError,
  ValidationError,
} = require("../../resources/errors.js");

// Pass me a typed ServerError and any extra details
const logError = (error, extra) => {

  const log = require("../../app").logger.error;
  log(error, extra);

};

const errorReducer = (err, req = null, shouldLog = true) => {

  let reducedError = err;
  let logOriginal = false;

  // Check for sequelize validation errors, reduce them to their meat.
  if (err.name === "SequelizeValidationError") {

    // Just get the first error's data.
    const { message, code = "VALIDATION_ERROR" } = err.errors[0];

    reducedError = new ValidationError(message, code);

  } else if (err instanceof ServerError) {

    reducedError = err;

  } else {

    reducedError = new ServerError({});
    logOriginal = true;

  }

  if (shouldLog) {

    const extra = {};

    if (req.authentication && req.authentication.user_id) {

      extra.userid = req.authentication.user_id;

    }

    logError(logOriginal ? err : reducedError, {
      ...extra,
    });

  }

  // ALWAYS return a typed ServerError
  return reducedError;

};

const sendError = (err, req, res, status = 400, shouldLog = true) => {

  const reducedError = errorReducer(err, req, shouldLog);

  return res.status(status).json(reducedError.toJson());

};

module.exports = {
  errorReducer,
  sendError,
};
