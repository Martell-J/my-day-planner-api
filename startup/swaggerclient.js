"use strict";

const { verifyJWT } = require("../api/helpers/auth.js");
const { ServerError, InvalidUserAuthorityError, InvalidTokenError } = require("../resources/errors.js");
const Promise = require("bluebird");

const SUPER_USER = "superadmin";
const auth = require("http-auth");
const authConnect = require("http-auth-connect");

module.exports = {

  "initializeSwaggerClient": (app) => {

    const { logger } = app;

    const SwaggerExpress = require("swagger-express-mw");
    const swaggerUi = require("swagger-ui-express");

    const { ENV, SWUI_USERNAME, SWUI_PASSWORD, AUTH_MW_OVERRIDE_KEY, API_KEY } = process.env;

    const authUser = (username, password, callback) => {

      callback(username === SWUI_USERNAME && password === SWUI_PASSWORD);

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

    const cors = require("cors");
    const path = require("path");

    return new Promise((resolve) => {

      // Authorize before accessing the basepath, when the path is '/ui' explicitly
      app.use("/ui", authConnect(basic));

      const swaggerConfig = {
        "appRoot": path.join(__dirname, "../"),
        "swaggerFile": path.join(__dirname, "../api"),
        "swagger": app.resolvedSwaggerMU, // Use the parsed JSON refs from earlier
        "swaggerSecurityHandlers": {
          "GlobalSecurity": (req, res, callback) => {

            if (req.headers.api_key === API_KEY) {

              return callback();

            }

            return callback(new InvalidUserAuthorityError());

          },
          "Authentication": (req, res, callback) => {

            // TODO: Add env to this handler, check for type outside production
            // Override all requests if the override key is passed (for testing only)
            // Uncomment during testing
            /*
            if (req.headers.authentication === AUTH_MW_OVERRIDE_KEY) {

              req.authentication = {
                "user_id": 0,
                "user_type": "superadmin",
              };

              return callback();

            }
            */

            // Allows for verification of correct access rights by typical auth
            // terminology (E.G user_type)
            const verifyByScopeExtension = () => {

              return new Promise((reslv, rejct) => {

                let authScopes = req.swagger.operation["x-authentication-scopes"];

                if (authScopes) {

                  if (authScopes.hasOwnProperty("user")) {

                    const userScopes = authScopes.user.scopes;

                    const userType = req.authentication.user_type;

                    // Scope to a user_type to verify whether or not they're allowed to access this resource.
                    if (userType !== SUPER_USER && userScopes.length !== 0 && !userScopes.find((scope) => scope === userType)) {

                      return rejct(new InvalidUserAuthorityError());

                    }

                  }

                }

                return reslv();

              });

            };


            verifyJWT(req.headers.authentication)
              .then((decoded) => {

                // Set the authorization parameter of the request object to contain
                // the data acquired via auth
                req.authentication = decoded;

              })
              .then(verifyByScopeExtension)
              .then(() => callback())
              .catch((e) => {

                // Conditional scoping for user-view
                // * Generify the error if the details aren't pertinent to what a user should be seeing
                if (e instanceof ServerError) {

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
