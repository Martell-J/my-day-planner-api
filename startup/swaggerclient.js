"use strict";

const { verifyJWT } = require("../api/helpers/auth.js");
const { ServerError, InvalidUserAuthorityError, InvalidTokenError } = require("../resources/errors.js");
const Promise = require("bluebird");

module.exports = {

  "initializeSwaggerClient": (app) => {

    const { logger } = app;

    const SwaggerExpress = require("swagger-express-mw");
    const swaggerUi = require("swagger-ui-express");

    const auth = require("http-auth");

    const { secret } = require("config");

    const authUser = (username, password, callback) => {

      callback(username === secret.swagger_ui.username && password === secret.swagger_ui.password);

    };

    // Create the swagger-ui with the given parameters for the API in the resolved config file,
    // and authorize the user before allowing them to access the resource
    const basic = auth.basic({ "realm": "swagger-ui", "skipUser": true }, (username, password, callback) =>
      authUser(username, password, callback));

    basic.on("error", (err, res) => {

      logger.error(err);

      return res.json({
        "message": "Internal error occurred",
        "code": "INTERNAL_ERROR",
      });

    });

    const authRequest = () =>
      auth.connect(basic);

    const cors = require("cors");
    const path = require("path");

    return new Promise((resolve) => {

      // Authorize before accessing the basepath, when the path is '/ui' explicitly
      app.use("/ui", authRequest());

      const swaggerConfig = {
        "appRoot": path.join(__dirname, "../"),
        "swaggerFile": path.join(__dirname, "../api"),
        "swagger": app.resolvedSwaggerMU, // Use the parsed JSON refs from earlier
        "swaggerSecurityHandlers": {
          "GlobalSecurity": (req, res, callback) => {

            if (secret.api_key === req.headers.api_key) {

              return callback();

            }

            return callback(new InvalidUserAuthorityError());

          },
          "Authentication": (req, res, callback) => {

            // TODO: Add env to this handler, check for type outside production
            // Override all requests if the override key is passed (for testing only)
            /*
            if (req.headers.authentication === secret.swagger_ui.overrideAuthenticationKey) {

              req.authentication = {
                "uid": 0,
              };

              return callback();

            }
            */

            verifyJWT(req.headers.authentication)
              .then((decoded) => {

                // Set the authorization parameter of the request object to contain
                // the data acquired via auth
                req.authentication = decoded;

                console.log(req.authentication)

                return callback();

              })
              .catch((e) => {

                // Conditional scoping for user-view
                // * Generify the error if the details aren't pertinent to what a user should be seeing
                if (e instanceof InvalidTokenError) {

                  app.logger.error(e);

                  return callback(new InvalidUserAuthorityError());

                } else if (e instanceof ServerError) {

                  return callback(e);

                }

                // You could do something more pertinent to server-errors here.
                return callback(e);

              });

          },
        },
      };

      SwaggerExpress.create(swaggerConfig, (err, swaggerExpress) => {

        // When debugging, log the path, controller, and operation of each request.
        if (app.debug) {

          if (err) {

            throw err;

          }

          app.use("/", (req, res, next) => {

            // Slice off any query parameters from the url
            const url = ~req.url.indexOf("?") ? req.url.slice(0, req.url.indexOf("?")) : req.url;

            // Get the relative path of the route given the url
            const pathSpec = swaggerExpress.runner.getPath(url);

            // If the path exists, log the details of it (Path, Controller, Operation, TimeStamp)
            if (pathSpec) {

              app.logger.info("Request details:\n\t"
                + "Path: " + pathSpec.path + "\n\t"
                + "Controller: " + pathSpec["x-swagger-router-controller"] + "\n\t"
                + "Operation: " + pathSpec.definition[req.method.toLowerCase()].operationId + "\n\t"
                + "TimeStamp: " + new Date().toISOString());

            }

            return next();

          });

        }

        // accept cross origin requests.
        app.use(cors());

        // install middleware
        swaggerExpress.register(app);

        app.logger.info("Swagger Client Created");

        // UI for the API is on /ui
        app.use("/ui", swaggerUi.serve, swaggerUi.setup(app.resolvedSwaggerMU));

        app.use((swmwErr, req, res, next) => {

          if (swmwErr) {

            if (swmwErr instanceof ServerError) {

              return res.status(400).json(swmwErr.toJson());

            }

            app.logger.error(swmwErr);

            if (swmwErr.hasOwnProperty("errors")) {

              return res.status(400).json({
                "code": swmwErr.errors[0].code,
                "message": swmwErr.errors[0].message,
              });

              // If the error isn't fitting the errorresponse definition...(This is 99% of the time, a swagger validation error)

            } else if (!swmwErr.hasOwnProperty("code" && !swmwErr.hasOwnProperty("message"))) {

              return res.status(400).json(new ServerError({}).toJson());

            }

          }

          return next(swmwErr);

        });

        app.logger.info("Swagger UI Client Created");

        resolve(app);

      });

    });

  },

};
