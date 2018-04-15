/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const { models } = require("../../app");
const { errors, errorReducer } = require("../helpers/errorhelper");
const cert = require("config").secret.jwt_key;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Error Codes
const EXISTING_USER = "Username already exists in our system.";
const NO_USER = "Username does not exist in our system.";
const INCORRECT_PASSWORD = "Password is incorrect.";
const INVALID_PASSWORD = "Password did not pass validation";
const INVALID_USERNAME = "Username did not pass validation";

const INVALID_TOKEN = "Token passed was invalid";
const TOKEN_EXPIRED = "Token has expired.";

const verifyJWT = (token) =>
  new Promise((resolve, reject) => {

    try {

      jwt.verify(token, cert, (err, decoded) => {

        if (err) {

          return reject(new errors.ServerError("InvalidTokenError", INVALID_TOKEN, "INVALID_TOKEN"));

        }

        if (decoded.exp >= Math.floor(Date.now() / 1000)) {

          return resolve(decoded);

        }

        return reject(new errors.ServerError("TOKEN_EXPIRED", TOKEN_EXPIRED, "TOKEN_EXPIRED"));

      });

    } catch (err) {

      return reject(new errors.ServerError("InvalidTokenError", INVALID_TOKEN, "INVALID_TOKEN"));

    }

  });

const endPoints = {

  "registerUser": (req, res) => {

    const data = req.swagger.params.data.value;

    const user = { ...data };

    // Check if the user already exists, match by username
    const getExistingUser = () =>
      models.User.findOne({
        "where": {
          "username": data.username,
        },
      });

    // Garner the password hash via bcrypt & SHA256(default)
    const getHashedPassword = () =>
      new Promise((resolve) =>

        bcrypt.hash(data.password, 10).then((hash) => {

          return resolve(hash);

        })

      );

    // Build the user (will fire any instance-validation methods)
    // If the user passes the build without throwing errors, save the record
    const buildAndSaveUser = (hash) =>
      new Promise((resolve, reject) => {

        user.password = hash;

        models.User.build(user)
          .save()
          .then(resolve)
          .catch((err) => reject(err));

      });

    // Chain everything together.
    // 1. Check if a user exists
    // 2. Hash the provided password
    // 3. Build and save the user
    // 4. Resolve.
    getExistingUser()
      .then((results) => {

        if (results) {

          throw new errors.ServerError("ExistingUserError", EXISTING_USER, "EXISTING_USER");

        }

        return getHashedPassword();

      })
      .then(buildAndSaveUser)
      .then(() => {

        res.send({
          "message": "record inserted!",
        });

      })
      .catch((err) => {

        return res.status(400).send(errorReducer(err));

      });

  },

  // Log the user into the system by providing them with a JWT
  // if the provided data is correct
  "loginUser": (req, res) => {

    const { username, password } = req.swagger.params.data.value;

    // Check if the user exists in the system
    const checkExistingUser = () =>
      new Promise((resolve, reject) =>
        models.User.findOne({ "where": { username } })
          .then((results) => {

            // If the results yield data, return it as a plain-object (get)
            if (results) {

              return resolve(results.get());

            }

            // Otherwise, throw an error
            return reject(new errors.ServerError("NoUserError", NO_USER, "NO_USER"));

          })
          .catch(reject)
      );

    // Compare the hashed password to the hash of the provided password via bcrypt
    const checkPassword = (user) =>
      new Promise((resolve, reject) => {

        bcrypt.compare(password, user.password)
          .then((isValid) => {

            // Throw an error if the password is incorrect
            if (!isValid) {

              return reject(new errors.ServerError("IncorrectPasswordError", INCORRECT_PASSWORD, "INCORRECT_PASSWORD"));

            }

            // Otherwise, pass the user-data up the chain
            return resolve(user);

          })
          .catch(reject);

      });

    // Sign the JWT for the user, and set it to expire in 1-day. Attach the issue-date
    // and the userid to the signed object
    const signJWT = (user) =>
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

      });

    // Tie it all together
    // 1. Check if the user exists
    // 2. Check if the password matches
    // 3. Sign a JWT containing data pertinent to the user and the signing
    // 4. Return the token
    checkExistingUser()
      .then(checkPassword)
      .then(signJWT)
      .then((token) => res.send({
        "message": "You have successfully logged in!",
        token,
      }))
      .catch((err) => {

        // Reduce any errors outside of the expected error-types.
        // Specifically here, we're dealing with sequelizevalidationerrors
        return res.status(400).send(errorReducer(err));

      });

  },
  "verifyUser": (req, res) => {

    const token = req.headers.auth;

    // Verify the token,


  }

};

module.exports = endPoints;
