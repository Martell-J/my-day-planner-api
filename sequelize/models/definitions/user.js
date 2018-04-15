"use strict";

module.exports = (sequelize, dataTypes) => {

  return sequelize.define("User", {
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
    "password": {
      "type": dataTypes.STRING,
      "allowNull": false,
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

};
