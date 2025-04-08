import mongoose from "mongoose";

const userDbSchema = new mongoose.Schema({
  login: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const UserDb = mongoose.model("User", userDbSchema);

export default UserDb;
