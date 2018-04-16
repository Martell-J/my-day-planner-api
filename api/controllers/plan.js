"use strict";

const { models } = require("../../app");

module.exports = {

  "getAllPlans": (req, res) => {

    models.Plan.findAll()
      .then((results) => res.json({ ...results }))
      .catch((err) => {

        return res.status(400).json({
          "name": err.name,
          "message": err.message,
        });

      });


  },

};
