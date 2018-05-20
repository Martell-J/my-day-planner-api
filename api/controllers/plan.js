"use strict";

const { models } = require("../../app");
const { sendError } = require("../helpers/errorhelper.js");

module.exports = {

  "getAllPlans": (req, res) => {

    models.Plan.findAll({
      "where": {
        "user_id": req.authentication.uid,
      },
    })
      .then((results) => res.json({ ...results }))
      .catch((err) => sendError(err, req, res));


  },

  "addPlan": (req, res) => {

    const data = { ...req.swagger.params.data.value, "user_id": req.authentication.uid };

    models.Plan.create(data)
      .then((result) => res.json({ ...result.get() }))
      .catch((err) => sendError(err, req, res));

  },

};
