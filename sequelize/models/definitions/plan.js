"use strict";

module.exports = (sequelize, dataTypes) => {

  return sequelize.define("Plan", {
    "plan_id": {
      "type": dataTypes.INTEGER,
      "primaryKey": true,
      "autoIncrement": true,
    },
    "user_id": {
      "type": dataTypes.INTEGER,
      "references": {
        "model": "tblusers",
        "key": "user_id",
      },
    },
    "plan_start_datetime": {
      "type": dataTypes.DATE,
    },
    "plan_end_datetime": {
      "type": dataTypes.DATE,
    },
    "plan_details": {
      "type": dataTypes.STRING,
    },
  }, {

    "syncOrder": 2,

    // Define the keyname generated via models index.js
    "keyName": "Plan",

    // Table paramters
    "tableName": "tblplans",
    "freezeTableName": true,

    // No timestamps
    "timestamps": false,
  });

};
