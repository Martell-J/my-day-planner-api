"use strict";

const { mongoose } = require("../../app");
const LogModel = mongoose.Log;

const { sendError } = require("../helpers/errorhelper");
const { getWithPagination } = require("../helpers/pagination");

module.exports = {

  "getAllLogs": (req, res) => {

    const count = req.swagger.params.count.value;
    const page = req.swagger.params.page.value;

    getWithPagination(LogModel, "find", page, count, "mongoose")
      .then((results) => {

        return res.status(200).json(results);

      })
      .catch((err) => sendError(err, req, res));

  },

};
