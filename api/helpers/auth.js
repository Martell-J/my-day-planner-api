"use strict";
const { InvalidTokenError } = require("../../resources/errors.js");
const cert = require("config").secret.jwt_key;
const jwt = require("jsonwebtoken");
const multipleToMillis = (value, type = "seconds") =>
  type === "minutes" ? (parseInt(value * 1000 * 60)) :
  type === "hours" ? (parseInt(value * 1000 * 60 * 60)) :
  type === "days" ? parseInt(value * 1000 * 60 * 60 * 60) : parseInt(value * 1000)

const NO_TOKEN = "No token provided.";
const TOKEN_EXPIRED = "Token has expired.";

module.exports = {

  // Sign the JWT for the user, and set it to expire in 1-day. Attach the issue-date
  // and the userid to the signed object
  "signJWT": (user) =>
    new Promise((resolve, reject) => {

      const DAYS = 0,
        HOURS = 12,
        MINUTES = 0,
        NOW = Math.floor(Date.now() / 1000),
        SECONDS = 0;

      // sign asynchronously
      jwt.sign({
        "issued": NOW, // Issued right now
        "user_id": user.user_id,
        "user_type": user.user_type,
        "expiry": NOW
          + multipleToMillis(SECONDS)
          + multipleToMillis(MINUTES, "minutes")
          + multipleToMillis(HOURS, "hours")
          + multipleToMillis(DAYS, "days"), // Forecast the expiry date to the current date + the length of the token's expiry
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

          if (decoded.expiry >= Math.floor(Date.now() / 1000)) {

            return resolve(decoded);

          }

          return reject(new InvalidTokenError(TOKEN_EXPIRED, "TOKEN_EXPIRED"));

        });

      } catch (err) {

        return reject(new InvalidTokenError());

      }

    }),
};
