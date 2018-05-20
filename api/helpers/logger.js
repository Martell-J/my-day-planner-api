"use strict";

const log = (logObject) => {

  const { mongoose, logger } = require("../../app");

  if (mongoose) {

    const ErrorModel = mongoose.Error;

    new ErrorModel(logObject).save();

  } else {

    logger.info("Mongoose Errors cannot be logged. Please set up your local MongoDB Database.");

  }

};

module.exports = log;
