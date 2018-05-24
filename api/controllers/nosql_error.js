"use strict";

const { mongoose } = require("../../app");
const ErrorModel = mongoose.Error;

const { sendError } = require("../helpers/errorhelper");
const { getWithPagination } = require("../helpers/pagination");

module.exports = {

  "getAllErrorLogs": (req, res) => {

    const count = req.swagger.params.count.value;
    const page = req.swagger.params.page.value;

    getWithPagination(ErrorModel, "find", page, count, "mongoose")
      .then((results) => {

        return res.status(200).json(results);

      })
      .catch((err) => sendError(err, req, res));

  },

};
