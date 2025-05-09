import mongoose from "mongoose";

const fileLinkDbSchema = new mongoose.Schema({
  link: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FileInfo",
    required: true,
    unique: true,
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isPublic: { type: Boolean, required: true },
  createAt: { type: Date, required: true },
  downloadCount: { type: Number, required: true },
  name: { type: String, required: false },
  description: { type: String, required: false },
});

const FileLinkDb = mongoose.model("FileLink", fileLinkDbSchema);

export default FileLinkDb;
