/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const { models } = require("../../app");

const endPoints = {

  "registerUser": (req, res) => {

    const data = req.swagger.params.data.value;

    console.log(data);

  },

};

module.exports = endPoints;
