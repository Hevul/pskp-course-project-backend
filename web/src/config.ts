import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;
const dbConnectionString = process.env.DB_CONNECTION_STRING;
const uploadDir = process.env.UPLOAD_DIRECTORY;

if (!jwtSecret) {
  throw new Error("JWT_SECRET");
}

if (!dbConnectionString) {
  throw new Error("DB_CONNECTION_STRING");
}

if (!uploadDir) {
  throw new Error("UPLOAD_DIRECTORY");
}

const config = {
  jwtSecret,
  dbConnectionString,
  uploadDir,
};

export default config;
