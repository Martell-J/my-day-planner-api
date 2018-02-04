"use strict";

module.exports = (sequelize, dataTypes) => {

  return sequelize.define("user", {
    "userid": {
      "type": dataTypes.INTEGER,
      "primaryKey": true,
      "autoIncrement": true,
    },
    "username": {
      "type": dataTypes.STRING,
      "allowNull": false,
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
    "firstname": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
    "lastname": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
    "password": {
      "type": dataTypes.STRING,
      "allowNull": false,
    },
  }, {

    // Define the keyname generated via models index.js
    "keyName": "User",

    // Table paramters
    "tableName": "tblusers",
    "freezeTableName": true,

    // No timestamps
    "timestamps": false,
  });

};
