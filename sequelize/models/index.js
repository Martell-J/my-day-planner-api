"use strict";

const fs = require("fs");
const Promise = require("bluebird");
const path = require("path");

const namespace = require("continuation-local-storage").createNamespace("seq-api-session");
const Sequelize = require("sequelize");
Sequelize.useCLS(namespace);

module.exports = {
  "initializeSequelizeDatabase": (app) => {

    const basename = path.basename(module.filename);

    const {
      ENV,
      DEBUG,
      SEQ_IS_FRESH,
      SEQ_USERNAME,
      SEQ_PASSWORD,
      SEQ_DATABASE,
      SEQ_HOST
    } = process.env;


    // Define the directory for each model definition
    const modelDir = path.join(__dirname, "/definitions");
    let db = {};
    let sequelize = null;

    // Use the environment variable if specified on the compiled config file
    sequelize = new Sequelize(
      SEQ_DATABASE,
      SEQ_USERNAME,
      SEQ_PASSWORD,
      {
        host: SEQ_HOST,
        port: "3306",
        dialect: "mysql",
        logging: ((DEBUG && DEBUG === 'true') || ENV !== "production"),
        encrypt: true,
        operatorsAliases: Sequelize.Op,
        dialectOptions: {
          multipleStatements: true,
          
        }
      }
    );


    // Custom model definitions for our current setup.
    const getModelDefinitions = () => {

      return new Promise((reslv) => {

        // Go through each definition
        const files = fs.readdirSync(modelDir)
          .filter((file) => {

            // Find files not named index, of type javascript
            return file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js";

          });

        // If we don't have any files, none are defined.
        if (files.length === 0) {

          return reslv(db);

        }

        // Import the file by joining the model directory and the filename into Sequelize
        files.forEach((file, i, array) => {

          let model = require(path.join(modelDir, file))(sequelize, Sequelize);

          const keyName = model.options.keyName;

          // If a keyname is specified, use it
          if (keyName) {

            db[keyName] = model;

          } else {

            // Otherwise, capitalize the first letter of the definition, and use that key
            db[model.name.charAt(0).toUpperCase() + model.name.slice(1)] = model;

          }

          // If we're at the end of the array...
          if (i === array.length - 1) {

            // go through every object
            Object.keys(db).forEach((modelName, idx, arr) => {

              // Check if there's an associate attribute tied to the sequelize model, if so.
              // execute it and pass all models. (Should auto-associate the correct models)
              if (db[modelName].associate) {

                db[modelName].associate(db);

              }

              // if we're at the end of the array, end the process
              if (idx === arr.length - 1) {

                reslv(db);

              }

            });

          }

        });

      });

    };

    const orderAndSync = (models) =>
      new Promise((resolve, reject) => {

        const sequentiallyIteratePromises = (promiseArray) =>
          Promise.each(promiseArray, (pf) => pf(), { "concurrency": 1 });

        app.logger.info(models);

        const modelArray = Object.values(models).sort((mod1, mod2) => mod1.options.syncOrder - mod2.options.syncOrder);

        // Create all tables in syncOrder
        const modelSyncPromises = modelArray.map((mod) => () => mod.sync());

        // Drop all tables if they already exist
        const dropAllTablesPromises = modelArray.map((modr) => () => modr.drop()).reverse();

        const postServerOps = [
          () => new Promise((reslv) => {

            // Sample data to generate a dummy-user
            const DEFAULT_PASSWORD = "password123";

            return models.User.create({
              "username": "johnathan",
              "email": "sample@fakemail.ca",
              "first_name": "John",
              "last_name": "Doe",
              "user_type": "superadmin",
              "password": DEFAULT_PASSWORD,
            }).then(reslv);

          }),
        ];

        return sequentiallyIteratePromises(dropAllTablesPromises)
          .then(() => sequentiallyIteratePromises(modelSyncPromises))
          .then(() => sequentiallyIteratePromises(postServerOps))
          .then(() => resolve(models))
          .catch(reject);

      });

    const syncDB = (models) =>
      new Promise((reslv, rjct) =>
        sequelize.authenticate()
          .then(() => reslv(models))
          .catch((error) => {

            // Will have an 'original' property
            const code = error.original.code || "N/A";

            // Create the database if it doesn't exist, then force-sync to match the schema to
            // our database.
            if (code === "ER_BAD_DB_ERROR") {

              app.logger.info("Syncing DB. First run?");

              const {options, password, username} = connection.sequelize;

              let seq = new Sequelize("", username, password, options)

              return seq.query("CREATE DATABASE " + config.connection.sequelize.database + ";")
                .then(() => reslv(models));

            } else {

              return rjct(new ServerError(error));

            }


          })
      );

    const tieRelationships = (models) =>
      new Promise((resolve, reject) => {

        // If we have all of the models, just tie in the connection model, and the assets object
        if (Object.keys(db).length === 0) {

          app.models = { sequelize, Sequelize };

          app.logger.info("Empty Sequelize Instance Initialized!");

          return resolve(app);

        }

        // Tie the relationships in before processing
        require("./relations/index")(models)
          .then((modelsWithRelations) => {

            // Tie in all relations, then append the sequelize connection model/object to the models
            // object
            modelsWithRelations.sequelize = sequelize;
            modelsWithRelations.Sequelize = Sequelize;

            return resolve(modelsWithRelations);

          });

      })

    return new Promise((resolve) => {

      return getModelDefinitions()
        .then(syncDB)
        .then(orderAndSync)
        .then(tieRelationships)
        .then((modelsWithRelations) => {

          // Handle at end...
          app.models = modelsWithRelations;

          app.logger.info("Sequelize Instance Initialized!");

          return resolve(app);

        })
        .catch((err) => {

          app.logger.error(err);

        });

    });

  },
};
