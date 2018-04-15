"use strict";

/*

  Contains relations for models which have their target foreignKeys on the
  target table from the source table

*/

module.exports = (models) =>
  new Promise((resolve) => {

    models.User.hasMany(models.Plan, { "foreignKey": "user_id" });

    return resolve(models);

  });
