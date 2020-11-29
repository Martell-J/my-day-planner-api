"use strict";

const winston = require("winston");
const { format } = winston;

module.exports = {
  "initializeLogger": (app) => {

    return new Promise((resolve) => {

      const consoleFormatter = format.printf(info => {
        return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
      });

      const logger = new winston.createLogger({
        "level": "info",
        "format": format.combine(
          format.json(),
          format.colorize(),
          format.label({ label: '[app-server]' }),
          format.timestamp(),
          format.splat(),
          consoleFormatter
        ),
        "defaultMeta": {"app": "swagger-express-boilerplate"},
        "transports": [
          new winston.transports.File({
            "name": "info",
            "level": "info",
            "filename": "./logs/all-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": false,
          }),
          new winston.transports.File({
            "name": "warn",
            "level": "warn",
            "filename": "./logs/warn-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": true,
          }),
          new winston.transports.File({
            "name": "error",
            "level": "error",
            "filename": "./logs/error-logs.log",
            "humanReadableUnhandledException": true,
            "handleExceptions": true,
            "json": true,
            "maxsize": 5242880, // 5MB
            "maxFiles": 5,
            "colorize": true,
          }),
          new winston.transports.Console({
            "level": "debug"
          }),
        ],
        "exitOnError": false,
      });

      console.log("Initializing logger");

      logger.debug(`Overriding "Express" logger`);

      const stream = {
        "write": (message) => {

          logger.info(message);

        },
      };

      const logWrapper = (message) => {

        if (app.mongoose) {

          const { mongoose } = app;

          const LogModel = mongoose.Log;

          const detailContext = !(message instanceof Error) ? { "type": "generic", "details": message } : {
            ...message.toJson ? message.toJson() : { "raw": message.toString ? message.toString() : "Not of extensible or of type 'Error'" },
            "type": "error",
          };

          new LogModel({
            "log": {
              ...detailContext
            },
            "details": message.getStack ? message.getStack() : message.stack ? message.stack : ""
          }).save();

        }

        return message;

      }

      app.use(require("morgan")("combined", { stream }));

      app.coreLogger = logger;

      app.logger = {
          "log": (level, message) => {
              logger.log(level, logWrapper(message));
          },
          "error": (message) => {
              logger.error(logWrapper(message));
          },
          "warn": (message) => {
              logger.warn(logWrapper(message));
          },
          "verbose": (message) => {
              logger.verbose(logWrapper(message));
          },
          "info": (message) => {
              logger.info(logWrapper(message));
          },
          "debug": (message) => {
              logger.debug(logWrapper(message));
          },
          "silly": (message) => {
              logger.silly(logWrapper(message));
          }
      };

      logger.debug("Logger initialized!");

      resolve(app);

    }).catch((err) => {

      //console.error(err);
      return Promise.reject(err);

    });

  },
};
