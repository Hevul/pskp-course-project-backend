import json from "../config.json";

const config = {
  jwtSecret: json.jwtSecret,
  dbConnectionString: json.dbConnectionString,
  uploadDir: json.uploadDir,
  tempDir: json.tempDir,
  clearCheckInterval: json.clearCheckInterval,
  tempFileMaxAge: json.tempFileMaxAge,
  port: json.port,
  address: json.address,
  maxFileSize: json.maxFileSize,
  corsSocket: json.corsSocket,
  apiPrefix: json.apiPrefix,
  env: json.env,
};

export default config;
