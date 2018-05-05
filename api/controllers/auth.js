/* eslint-disable no-console */
"use strict";

// Put the test for each models and their relational data here...i guess
const { models } = require("../../app");
const { errors, errorReducer } = require("../helpers/errorhelper");
const { AuthenticationError, ValidationError } = errors;
const { signJWT } = require("../helpers/auth.js");

const bcrypt = require("bcrypt");

// Error Codes
const EXISTING_USER = "Username already exists in our system.";
const NO_USER = "Username does not exist in our system.";
const INCORRECT_PASSWORD = "Password is incorrect.";

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

          throw new ValidationError(EXISTING_USER, "EXISTING_USER");

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
            return reject(new AuthenticationError(NO_USER, "NO_USER"));

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
      .catch((err) => {

        // Reduce any errors outside of the expected error-types.
        // Specifically here, we're dealing with sequelizevalidationerrors
        return res.status(400).json(errorReducer(err));

      });

  },

};

module.exports = endPoints;
