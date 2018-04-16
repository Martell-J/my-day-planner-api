"use strict";
const { InvalidTokenError } = require("./errorhelper.js").errors;
const cert = require("config").secret.jwt_key;
const jwt = require("jsonwebtoken");

const NO_TOKEN = "No token provided.";
const TOKEN_EXPIRED = "Token has expired.";

module.exports = {

  // Sign the JWT for the user, and set it to expire in 1-day. Attach the issue-date
  // and the userid to the signed object
  "signJWT": (user) =>
    new Promise((resolve, reject) => {

      const DAYS = 1,
        HOURS = 24,
        MINUTES = 60,
        NOW = Math.floor(Date.now() / 1000),
        SECONDS = 60;

      // sign asynchronously
      jwt.sign({
        "iat": NOW,
        "uid": user.userid,
        "exp": NOW + SECONDS * MINUTES * HOURS * DAYS,
      }, cert, {}, (err, token) => {

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

      if (!token || token === "") {

        return reject(new InvalidTokenError(NO_TOKEN, "NO_TOKEN"));

      }

      try {

        jwt.verify(token, cert, (err, decoded) => {

          if (err) {

            return reject(new InvalidTokenError());

          }

          if (decoded.exp >= Math.floor(Date.now() / 1000)) {

            return resolve(decoded);

          }

          return reject(new InvalidTokenError(TOKEN_EXPIRED, "TOKEN_EXPIRED"));

        });

      } catch (err) {

        return reject(new InvalidTokenError());

      }

    }),
};
