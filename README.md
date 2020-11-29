# Purpose

The purpose of this repository is to provide an api which can interact with the
my-day-planner repository in-order to demonstrate an understanding of cross-origin
ineraction with an external api, and the backend operation of a RESTful API.

This api will feature:
  1. All features from the "swagger-express-boilerplate" repository
  2. User-authentication, and registration.
  3. CRUD options for the operation of a DayPlanner model.
  4. Simple API security (with potential to upgrade security method)

# Startup

After pulling a copy of the repository

-- Ensure you have yarn installed (1.3.2 or Later) --

'yarn install' - Initialize lockfile, and garner dependencies

'yarn seq-init' From Project Root - Runs the sequelize-init script via node

'yarn local-generic' OR 'yarn local-debug' - Runs local database-configuration, in generic or debug mode

# Sequelize-CLI

'yarn sequelize --env=local-debug' - will run CLI commands with the specified configuration based on 'env' flag
 -- Note: You MUST explicitly define the 'env' flag per each command. --
