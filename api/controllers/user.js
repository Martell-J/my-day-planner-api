"use strict";

const { models } = require("../../app");

module.exports = {

  "getUserByAuthorization": (req, res) => {

    models.User.find({
      "where": {
        "user_id": req.authorization.uid,
      },
      "attributes": [ "user_id", "username", "email", "first_name", "last_name", "user_type" ],
    })
      .then((results) => res.json({ "user": { ...results.get() }, "exp": req.authorization.exp, "iat": req.authorization.iat }))
      .catch((err) => {

        return res.status(400).json({
          "name": err.name,
          "message": err.message,
        });

      });


  },

};
