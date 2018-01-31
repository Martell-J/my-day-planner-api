"use strict";

module.exports = {
  "up": (queryInterface, Sequelize) => {

    return new Promise((resolve, reject) => {

      queryInterface.dropTable("tblusers")
        .then(() => {

          return queryInterface.createTable("tblusers", {
            "userid": {
              "allowNull": false,
              "primaryKey": true,
              "autoIncrement": true,
              "type": Sequelize.INTEGER,
            },
            "username": {
              "allowNull": false,
              "type": Sequelize.STRING,
            },
            "email": {
              "allowNull": false,
              "type": Sequelize.STRING,
            },
            "firstname": {
              "allowNull": false,
              "type": Sequelize.STRING,
            },
            "lastname": {
              "allowNull": false,
              "type": Sequelize.STRING,
            },
            "password": {
              "allowNull": true,
              "type": Sequelize.STRING,
            },
          });

        })
        .then(resolve)
        .catch(reject);

    });

  },

};
