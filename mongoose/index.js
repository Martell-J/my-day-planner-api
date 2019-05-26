"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const fs = require("fs");
const path = require("path");

const tieModelsIn = () =>
  new Promise((resolve) => {

    const modelDir = path.join(__dirname, "/models");

    // Read the models directory
    fs.readdirSync(modelDir)
      .forEach((file, i, array) => {

        // Tie the model into the connection object
        require(path.join(modelDir, file))(mongoose);

        // TODO: Check to see if documents exist the model's associated collection, and
        // delete them if they do.

        // Resolve the promise after logic is executed against the last file.
        if (i === array.length - 1) {

          return resolve();

        }

      });

  });

module.exports = {
  "initializeMongooseDatabase": (app) => {

    const {
      CONNECTION_MONGOOSE_USERNAME,
      CONNECTION_MONGOOSE_PASSWORD,
      CONNECTION_MONGOOSE_DATABASE,
      CONNECTION_MONGOOSE_HOST,
      CONNECTION_MONGOOSE_PORT
    } = process.env;

    return new Promise((resolve) => {

      app.logger.info("Using MongoDB database...");

      const dbConnectionString = "mongodb://"
        + CONNECTION_MONGOOSE_USERNAME + ":"
        + CONNECTION_MONGOOSE_PASSWORD + "@"
        + CONNECTION_MONGOOSE_HOST + ":"
        + CONNECTION_MONGOOSE_PORT + "/"
        + CONNECTION_MONGOOSE_DATABASE;
      // Now promise-based.
      mongoose.connect(dbConnectionString, {
        "keepAlive": true,
        "auto_reconnect": true,
      }).then(() => {

        app.logger.info("MongoDB connected!");

        return tieModelsIn()
          .then(() => {

            // Connection object will now have Models
            app.mongoose = mongoose.models;

            return resolve(app);

          });

      })
      .catch((err) => {

        app.logger.error(err);

        app.mongoose = null;
        return resolve(app);

      });

    });

  },
};
