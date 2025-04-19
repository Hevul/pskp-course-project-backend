import json from "../config.json";

const config = {
  jwtSecret: json.jwtSecret,
  dbConnectionString: json.dbConnectionString,
  uploadDir: json.uploadDir,
  tempDir: json.tempDir,
  clearCheckInterval: json.clearCheckInterval,
  tempFileMaxAge: json.tempFileMaxAge,
};

export default config;
