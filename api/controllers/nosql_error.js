"use strict";

const { mongoose } = require("../../app");
const ErrorModel = mongoose.Error;

const { sendError } = require("../helpers/errorhelper");

module.exports = {

  "getAllErrorLogs": (req, res) => {

    ErrorModel.find()
      .then((results) => {

        return res.status(200).json(results);

      })
      .catch((err) => sendError(err, res));

  },

};
