"use strict";

// Engines
const MONGOOSE = "mongoose",
  SEQUELIZE = "sequelize";

// Mongoose REQUIRES model context when executing any model functions or it can't
// access the connections query property

const getWithPagination = (model, method, page = 1, count = 10, engine = "sequelize", condition = {}) =>
  engine === SEQUELIZE
    ? model[method]({
      ...condition,
      "limit": parseInt(count),
      "offset": parseInt(page) * parseInt(count),
    })
    : new Promise((resolve, reject) => {

      model[method]({
        ...condition,
      })
        .skip((parseInt(page) - 1) * parseInt(count))
        .limit(parseInt(count))
        .exec((err, data) =>
          err ? reject(err) : resolve(data));

    });

module.exports = {
  getWithPagination,
};
