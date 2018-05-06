"use strict";

const { models } = require("../../app");
const { errorReducer } = require("../helpers/errorhelper.js");

module.exports = {

  "getAllPlans": (req, res) => {

    models.Plan.findAll({
      "where": {
        "user_id": req.authorization.uid,
      },
    })
      .then((results) => res.json({ ...results }))
      .catch((err) => {

        return res.status(400).json({
          "name": err.name,
          "message": err.message,
        });

      });


  },

  "addPlan": (req, res) => {

    const data = { ...req.swagger.params.data.value, "user_id": req.authorization.uid };

    models.Plan.create(data)
      .then((result) => res.json({ ...result.get() }))
      .catch((err) => {

        return res.status(400).json(errorReducer(err));

      });

  },

};
