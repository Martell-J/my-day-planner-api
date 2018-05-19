"use strict";

const logObject = require("./logger.js");

class ServerError extends Error {

  constructor({ name, message, code, stacktrace }) {

    super();
    this.name = name || "ServerError";
    this.message = message || "A generic server error has occurred. Please contact an administrator.";
    this.code = code || "SERVER_ERROR";
    this.stacktrace = stacktrace || "";

  }

  toJson() {

    const { name, message, code } = this;

    return { name, message, code };

  }

  log(extra = {}) {

    const { name, message, code, stacktrace } = this;

    logObject({
      "error": { name, message, code },
      "details": stacktrace,
      ...extra,
    });

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

const errorReducer = (err) => {

  // Check for sequelize validation errors, reduce them to their meat.
  if (err.name === "SequelizeValidationError") {

    // Just get the first error's data.
    const { message, code = "VALIDATION_ERROR" } = err.errors[0];

    return new ValidationError(message, code);

  } else if (err instanceof ServerError) {

    return err;

  }

  // TODO:
  // NOSQL Error logger to handle unexpected errors in this reducer, then
  // reduce the error into a ServerError (generic) for user-output

  // Why not go full error-handling mode and create an intuitive UI to access
  // these errors from on the front end? (We'll need user types and the like.)
  return err;

};

const sendError = (err, res, status = 400, shouldLog = true) => {

  const reducedError = errorReducer(err);

  if (reducedError instanceof ServerError && shouldLog) {

    const extra = res.authentication || {};

    reducedError.log(extra);

  }

  return res.status(status).json();

};

module.exports = {
  "errors": { ServerError, InvalidTokenError, InvalidUserAuthorityError, ValidationError, AuthenticationError },
  errorReducer,
  sendError,
};
