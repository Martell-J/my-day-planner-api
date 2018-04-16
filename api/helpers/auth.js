"use strict";
const { ServerError } = require("./errorhelper.js").errors;
const cert = require("config").secret.jwt_key;
const jwt = require("jsonwebtoken");

const INVALID_TOKEN = "Token passed was invalid";
const TOKEN_EXPIRED = "Token has expired.";

module.exports = {

  // Sign the JWT for the user, and set it to expire in 1-day. Attach the issue-date
  // and the userid to the signed object
  "signJWT": (user) =>
    new Promise((resolve, reject) => {

      // sign asynchronously
      jwt.sign({ "iat": Math.floor(Date.now() / 1000), "uid": user.userid }, cert, { "exp": 60 * 60 * 24 }, (err, token) => {

        // If there an error signing, pass it up the chain
        if (err) {

          return reject(err);

        }

        // Otherwise, pass the token up the chain
        return resolve(token);

      });

    }),
  "verifyJWT": (token) =>
    new Promise((resolve, reject) => {

      const getInvalidTokenError = () => new ServerError("InvalidTokenError", INVALID_TOKEN, "INVALID_TOKEN");

      if (!token || token === "") {

        return reject(getInvalidTokenError());

      }

      try {

        jwt.verify(token, cert, (err, decoded) => {

          if (err) {

            return reject(getInvalidTokenError());

          }

          if (decoded.exp >= Math.floor(Date.now() / 1000)) {

            return resolve(decoded);

          }

          return reject(new ServerError("InvalidTokenError", TOKEN_EXPIRED, "TOKEN_EXPIRED"));

        });

      } catch (err) {

        return reject(new ServerError("InvalidTokenError", INVALID_TOKEN, "INVALID_TOKEN"));

      }

    }),
};
