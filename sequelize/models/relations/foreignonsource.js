"use strict";

/*

  Contains relations for models which have their target foreignKeys on the
  source table from the target table

*/

module.exports = (models) =>
  new Promise((resolve) => {

    models.Plan.belongsTo(models.User, { "foreignKey": "user_id" });

    return resolve(models);

  });
