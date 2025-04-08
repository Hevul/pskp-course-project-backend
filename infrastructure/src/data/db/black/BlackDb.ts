import mongoose from "mongoose";

const blackDbSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

const BlackDb = mongoose.model("Black", blackDbSchema);

export default BlackDb;
