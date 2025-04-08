import mongoose from "mongoose";

const userStorageDbSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

userStorageDbSchema.index({ owner: 1, name: 1 }, { unique: true });

const UserStorageDb = mongoose.model("UserStorage", userStorageDbSchema);

export default UserStorageDb;
