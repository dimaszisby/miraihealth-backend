const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || "development";

// Set separate test database
dotenv.config({
  path:
    env === "test"
      ? path.resolve(__dirname, "../.env.test")
      : path.resolve(__dirname, "../.env"),
});

// Require the configuration after loading environment variables
const config = require("./config");

const sequelize = new Sequelize(config[env].url, {
  host: config[env].host || '127.0.0.1',
  port:  config[env].port || 5432,
  protocol: "postgres",
  dialect: config[env].dialect,
  logging: config[env].logging || false, // Disable logging; default: console.log
  quoteIdentifiers: false,
  define: {
    freezeTableName: false,
    underscored: true,
    quoteIdentifiers: false,
  },
  dialectOptions: {
    options: "-c search_path=public",
    application_name: "Sequelize",
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            require: true,
            rejectUnauthorized: false, // Allow self-signed certificates
          }
        : false,
  },
});

module.exports = sequelize;
