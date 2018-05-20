"use strict";

const { models } = require("../../app");
const { sendError } = require("../helpers/errorhelper");

module.exports = {

  "getUserByAuthorization": (req, res) => {

    models.User.find({
      "where": {
        "user_id": req.authentication.uid,
      },
      "attributes": [ "user_id", "username", "email", "first_name", "last_name", "user_type" ],
    })
      .then((results) => res.json({ "user": { ...results.get() }, "exp": req.authentication.exp, "iat": req.authentication.iat }))
      .catch((err) => {

        return sendError(err, req, res);

      });


  },

};
