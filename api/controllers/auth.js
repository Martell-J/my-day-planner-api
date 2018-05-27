/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const { models } = require("../../app");
const { sendError } = require("../helpers/errorhelper");
const { AuthenticationError, ValidationError } = require("../../resources/errors.js");
const { signJWT } = require("../helpers/auth.js");

// Error Codes
const EXISTING_USER = "Username already exists in our system.";
const NO_USER = "Username does not exist in our system.";
const INCORRECT_PASSWORD = "Password is incorrect.";
const DISABLED_ACCOUNT = "Your account has been disabled.";

const endPoints = {

  "registerUser": (req, res) => {

    const data = req.swagger.params.data.value;

    const user = { ...data, "user_type": "member" };

    // Check if the user already exists, match by username
    const getExistingUser = () =>
      models.User.findOne({
        "where": {
          "username": data.username,
        },
      });

    // Build the user (will fire any instance-validation methods)
    // If the user passes the build without throwing errors, save the record
    const buildAndSaveUser = () =>
      new Promise((resolve, reject) =>
        models.User.build(user)
          .save()
          .then(resolve)
          .catch((err) => reject(err))
      );

    // Chain everything together.
    // 1. Check if a user exists
    // 2. Build and save the user (Hash checking occurrs on the model)
    // 3. Resolve.
    getExistingUser()
      .then((results) => {

        if (results) {

          throw new ValidationError(EXISTING_USER, "EXISTING_USER");

        }

        return buildAndSaveUser();

      })
      .then(() => {

        res.send({
          "message": "record inserted!",
        });

      })
      .catch((err) => sendError(err, req, res));

  },

  // Log the user into the system by providing them with a JWT
  // if the provided data is correct
  "loginUser": (req, res) => {

    const { username, password } = req.swagger.params.data.value;

    // Check if the user exists in the system
    const checkExistingUser = () =>
      new Promise((resolve, reject) =>
        models.User.findOne({ "where": { username } })
          .then((user) => {

            // If the results yield data, return it as a plain-object (get)
            if (user) {

              if (user.user_type === "disabled") {

                return reject(new AuthenticationError(DISABLED_ACCOUNT, "DISABLED_ACCOUNT"));

              }

              return resolve(user);

            }

            // Otherwise, throw an error
            return reject(new AuthenticationError(NO_USER, "NO_USER"));

          })
          .catch(reject)
      );

    // Compare the hashed password to the hash of the provided password via bcrypt
    const checkPassword = (user) =>
      new Promise((resolve, reject) => {

        user.isEqualPassword(password)
          .then((isValid) => {

            // Throw an error if the password is incorrect
            if (!isValid) {

              return reject(new AuthenticationError(INCORRECT_PASSWORD, "INCORRECT_PASSWORD"));

            }

            // Otherwise, pass the user-data up the chain
            return resolve(user);

          })
          .catch(reject);

      });

    // Tie it all together
    // 1. Check if the user exists
    // 2. Check if the password matches
    // 3. Sign a JWT containing data pertinent to the user and the signing
    // 4. Return the token
    return checkExistingUser()
      .then(checkPassword)
      .then(signJWT)
      .then((token) => res.json({
        "message": "You have successfully logged in!",
        token,
      }))
      .catch((err) => sendError(err, req, res));

  },

};

module.exports = endPoints;
