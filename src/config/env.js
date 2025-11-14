const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  HOST: process.env.HOST,
  DATABASE: process.env.DATABASE,
  USER: process.env.USER,
  PASSWORD: process.env.PASSWORD,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
  PORT: process.env.PORT || 4000
};