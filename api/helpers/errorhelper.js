"use strict";

class ServerError extends Error {

  constructor({ name, message, code }) {

    super();
    this.name = name || "ServerError";
    this.message = message || "A generic server error has occurred. Please contact an administrator.";
    this.code = code || "SERVER_ERROR";

  }

  toJson() {

    const { name, message, code } = this;

    return { name, message, code };

  }

  getStack() {

    const { stack } = this;

    return stack ? stack : "";

  }

}

// Subclass the generic error for tokens
class InvalidTokenError extends ServerError {

  constructor(message = null, code = null) {

    super({
      "name": "InvalidTokenError",
      "message": message || "Token passed was invalid.",
      "code": code || "INVALID_TOKEN",
    });

  }

}

class InvalidUserAuthorityError extends ServerError {

  constructor(message = null, code = null) {

    super({
      "name": "InvalidUserAuthorityError",
      "message": message || "The requested resource is outside of the user's access rights.",
      "code": code || "INVALID_ACCESS_RIGHTS",
    });

  }

}

class ValidationError extends ServerError {

  constructor(message, code = "VALIDATION_ERROR") {

    super({
      "name": "ValidationError",
      message,
      "code": code || "VALIDATION_ERROR",
    });

  }

}

class AuthenticationError extends ServerError {

  constructor(message = null, code = null) {

    super({
      "name": "AuthenticationError",
      "message": message || "A generic error has occurred during Authentication.",
      "code": code || "AUTHENTICATION_ERROR",
    });

  }

}

// Pass me a typed ServerError and any extra details
const logError = (error, extra) => {

  const log = require("../../app").logger.error;
  log(error, extra);

};

const errorReducer = (err) => {

  // Check for sequelize validation errors, reduce them to their meat.
  if (err.name === "SequelizeValidationError") {

    // Just get the first error's data.
    const { message, code = "VALIDATION_ERROR" } = err.errors[0];

    return new ValidationError(message, code);

  } else if (err instanceof ServerError) {

    return err;

  }

  return err;

};

const sendError = (err, res, status = 400, shouldLog = true) => {

  const reducedError = errorReducer(err);

  if (reducedError instanceof ServerError && shouldLog) {

    const extra = res.authentication || {};

    logError(reducedError, {
      ...extra,
    });

  }

  return res.status(status).json(reducedError.toJson());

};

module.exports = {
  "errors": { ServerError, InvalidTokenError, InvalidUserAuthorityError, ValidationError, AuthenticationError },
  errorReducer,
  sendError,
};
