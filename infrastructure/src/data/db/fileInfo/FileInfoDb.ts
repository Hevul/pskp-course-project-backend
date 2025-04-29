import mongoose from "mongoose";

const fileInfoDbSchema = new mongoose.Schema({
  name: { type: String, required: true },
  uploadAt: { type: Date, required: true },
  updateAt: { type: Date, required: false },
  size: { type: Number, required: true },
  storage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserStorage",
    required: true,
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DirInfo",
    required: false,
  },
  physicalFileId: {
    type: String,
    required: true,
    default: function () {
      return (this as any)._id.toString();
    },
  },
});

fileInfoDbSchema.index({ name: 1, parent: 1, storage: 1 }, { unique: true });
fileInfoDbSchema.index({ physicalFileId: 1 });

const FileInfoDb = mongoose.model("FileInfo", fileInfoDbSchema);

export default FileInfoDb;
