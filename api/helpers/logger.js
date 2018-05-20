"use strict";

const log = (logObject) => {

  const ErrorModel = require("../../app").mongoose.Error;

  new ErrorModel(logObject).save();

};

module.exports = log;
