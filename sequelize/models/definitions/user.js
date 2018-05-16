"use strict";

const bcrypt = require("bcrypt");

const VALID_USER_TYPES = [
  "superadmin",
  "admin",
  "member",
  "test",
];
const SALT_ROUNDS = 12;

module.exports = (sequelize, dataTypes) => {

  const userModel = sequelize.define("User", {
    "user_id": {
      "type": dataTypes.INTEGER,
      "primaryKey": true,
      "autoIncrement": true,
    },
    "username": {
      "type": dataTypes.STRING,
      "allowNull": false,
      "isUnique": true,
    },
    "email": {
      "type": dataTypes.STRING,
      "allowNull": false,
      "isUnique": true,
      "validate": {
        "isEmail": {
          "msg": "A valid email address must be provided.",
        },
      },
    },
    "first_name": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
    "last_name": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
    "user_type": {
      "type": dataTypes.STRING,
      "allowNull": false,
      "validate": {
        "isIn": [VALID_USER_TYPES],
      },
    },
    "password": {
      "type": dataTypes.STRING,
      "allowNull": false,
      set(val) {

        // Validation must come BEFORE the set here, so we can't do a custom validator.
        if (!new RegExp(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{9,20}$/).test(val)) {

          throw new Error("Password must be between 9 and 20 characters inclusive, and include at least 1 number and letter.");

        }

        this.setDataValue("password", bcrypt.hashSync(val, SALT_ROUNDS));

      },
      get() {

        // Never allow the password hash to return. (handle it within the model)
        return "";

      },
    },
  }, {

    // Define the keyname generated via models index.js
    "keyName": "User",

    "syncOrder": 1,

    // Table paramters
    "tableName": "tblusers",
    "freezeTableName": true,

    // No timestamps
    "timestamps": false,

  });

  // Can't use ES6 Arrow Function here as it messes up the way .apply and .call bind 'this'
  userModel.prototype.isEqualPassword = function isEqualPassword(password) {

    return bcrypt.compare(password, this.getDataValue("password"));

  };


  return userModel;

};
