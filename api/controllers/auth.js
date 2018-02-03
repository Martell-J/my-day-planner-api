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
const INVALID_EMAIL = "Email address invalid.";
const INVALID_PASSWORD = "Password did not pass validation";
const INVALID_USERNAME = "Username did not pass validation";


const endPoints = {

  "registerUser": (req, res) => {

    const data = req.swagger.params.data.value;

    const user = { ...data };

    const getExistingUser = () =>
      models.User.findOne({
        "where": {
          "username": data.username,
        },
      });

    const getHashedPassword = () =>
      new Promise((resolve) =>

        bcrypt.hash(data.password, 10).then((hash) => {

          return resolve(hash);

        })

      );

    const buildAndSaveUser = (hash) =>
      new Promise((resolve, reject) => {

        user.password = hash;

        models.User.build(user)
          .save()
          .then(resolve)
          .catch((err) => reject(err));

      });

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

  "loginUser": (req, res) => {

    const { username, password } = req.swagger.params.data.value;

    const tryLogin = () =>
      new Promise((resolve, reject) =>
        models.User.findOne({ "where": { username }})
          .then((results) => {

            if (results) {

              return resolve(results.get());

            }

            return reject(new errors.ServerError("NoUserError", NO_USER, "NO_USER"));

          })
          .catch(reject)
      );

    const checkPassword = (user) =>
      new Promise((resolve, reject) => {

        bcrypt.compare(password, user.password)
          .then((isValid) => {

            if (!isValid) {

              return reject(new errors.ServerError("IncorrectPasswordError", INCORRECT_PASSWORD, "INCORRECT_PASSWORD"));

            }

            return resolve(user);

          })
          .catch(reject);

      });

    const signJWT = (user) =>
      new Promise((resolve, reject) => {

        // sign asynchronously
        jwt.sign({ "iat": Math.floor(Date.now() / 1000), "uid": user.userid }, cert, { "expiresIn": 60 * 60 * 24 }, (err, token) => {

          if (err) {

            return reject(err);

          }

          return resolve(token);

        });

      });

    tryLogin()
      .then(checkPassword)
      .then(signJWT)
      .then((token) => res.send({
        "message": "You have successfully logged in!",
        token,
      }))
      .catch((err) => {

        console.log(err)

        return res.status(400).send(errorReducer(err));

      });

  },

};

module.exports = endPoints;
