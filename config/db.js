const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

// 1. Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || "development";

// 2. Set separate test database
dotenv.config({
  path:
    env === "test"
      ? path.resolve(__dirname, "../.env.test")
      : path.resolve(__dirname, "../.env"),
});

// 3. Require the configuration after loading environment variables
const config = require("./config");

// 4. Initialize Sequelize
const sequelize = new Sequelize(config[env].url, {
  host: config[env].host || "127.0.0.1",
  port: config[env].port || 5432,
  protocol: "postgres",
  dialect: config[env].dialect,
  logging: config[env].logging || false, // Disable logging; default: console.log
  quoteIdentifiers: false,
  define: {
    freezeTableName: false,
    underscored: true,
    quoteIdentifiers: false,
  },
  dialectOptions: config[env].dialectOptions, // Use dialectOptions from config.js
});

module.exports = sequelize;
