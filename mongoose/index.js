"use strict";

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const fs = require("fs");
const path = require("path");

const config = require("config");
const mongo = config.connection.mongoose;

const tieModelsIn = (connection) =>
  new Promise((resolve) => {

    const modelDir = path.join(__dirname, "/models");

    // Read the models directory
    fs.readdirSync(modelDir)
      .forEach((file, i, array) => {

        // Tie the model into the connection object
        require(path.join(modelDir, file))(connection, mongoose);

        // Resolve the promise after logic is executed against the last file.
        if (i === array.length - 1) {

          return resolve();

        }

      });

  });

module.exports = {
  "initializeMongooseDatabase": (app) => {

    return new Promise((resolve) => {

      app.logger.info("Using MongoDB database...");

      const dbConnectionString = "mongodb://"
        + mongo.username + ":"
        + mongo.password + "@"
        + mongo.host + ":"
        + mongo.port + "/"
        + mongo.database;

      const connection = mongoose.createConnection(dbConnectionString, {
        "keepAlive": true,
      });

      connection.on("connecting", () => {

        app.logger.info("connecting to MongoDB...");

      });

      connection.on("error", (error) => {

        app.logger.error("Error in MongoDb connection: " + error);
        mongoose.disconnect();

      });

      connection.on("open", () => {

        app.logger.info("MongoDB connection opened!");

      });

      connection.on("connected", () => {

        app.logger.info("MongoDB connected!");

      });

      connection.on("reconnected", () => {

        app.logger.info("MongoDB reconnected!");

      });

      connection.on("disconnected", () => {

        app.logger.info("MongoDB disconnected!");

        mongoose.connect(dbConnectionString, { "server": { "auto_reconnect": true } });

      });

      return tieModelsIn(connection)
        .then(() => {

          // Connection object will now have Models
          app.mongoose = connection.models;

          return resolve(app);

        });

    });

  },
};
