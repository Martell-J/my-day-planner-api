"use strict";

class ServerError extends Error {

  constructor(name = null, message = null, code = null) {

    super();
    this.name = name || "ServerError";
    this.message = message || "A generic server error has occurred. Please contact an administrator.";
    this.code = code || "SERVER_ERROR";

  }

}

const errorReducer = (err) => {

  // Check for sequelize validation errors, reduce them to their meat.
  if (err.name === "SequelizeValidationError") {

    // Just get the first error's data.
    const { message, code = "VALIDATION_ERROR" } = err.errors[0];

    return new ServerError("ValidationError", message, code);

  }

  return err;

};

module.exports = {
  "errors": { ServerError },
  errorReducer,
};
