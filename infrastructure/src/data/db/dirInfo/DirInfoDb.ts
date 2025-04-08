import mongoose from "mongoose";

const dirInfoDbSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uploadAt: { type: Date, required: true },
  storage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Storage",
    required: true,
  },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileInfo" }],
  subdirectories: [{ type: mongoose.Schema.Types.ObjectId, ref: "DirInfo" }],
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DirInfo",
  },
});

dirInfoDbSchema.index({ name: 1, parent: 1, storage: 1 }, { unique: true });

const DirInfoDb = mongoose.model("DirInfo", dirInfoDbSchema);

export default DirInfoDb;
