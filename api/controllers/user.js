"use strict";

const { models } = require("../../app");
const { sendError } = require("../helpers/errorhelper");

module.exports = {

  "getUserByAuthorization": (req, res) => {

    models.User.findOne({
      "where": {
        "user_id": req.authentication.user_id,
      },
      "attributes": [ "user_id", "username", "email", "first_name", "last_name", "user_type" ],
    })
      .then((results) => res.json({ "user": { ...results.get() }, "expiry": req.authentication.expiry, "issued": req.authentication.issued }))
      .catch((err) => sendError(err, req, res));


  },

};
