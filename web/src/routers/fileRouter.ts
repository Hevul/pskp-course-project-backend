import express, { RequestHandler } from "express";
import multer from "multer";
import { FileController } from "../controllers/FileController";
import validateFile from "../middlewares/validators/requireFile";
import { body, param } from "express-validator";
import validateRequest from "../middlewares/validators/validateRequest";
import fileInfoErrorHandler from "../errorHandlers/handlers/fileInfoErrorHandler";
import { uploadCleanup } from "../middlewares/utils/uploadCleanup";
import { uploadLarge } from "../utils/multerConfig";

const uploadSmall = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
});

const createRouter = (
  authenticate: RequestHandler,
  fileController: FileController
) => {
  const router = express.Router();

  router
    .get("/id", fileController.get) //! BUG
    .get(
      "/get-all-by-storage/:storageId/:parentId?",
      authenticate,
      getFilesChain(),
      validateRequest,
      fileController.getAllByStorageId
    )
    .post(
      "/upload",
      authenticate,
      uploadSmall.single("file"),
      validateFile,
      uploadChain(),
      validateRequest,
      fileController.upload
    )
    .post(
      "/upload-large",
      authenticate,
      uploadLarge.single("file"),
      validateFile,
      uploadChain(),
      uploadCleanup,
      validateRequest,
      fileController.uploadLarge
    )
    .post(
      "/overwrite",
      authenticate,
      uploadSmall.single("file"),
      validateFile,
      overwriteChain(),
      validateRequest,
      fileController.overwrite
    )
    .post(
      "/overwrite-large",
      authenticate,
      uploadLarge.single("file"),
      validateFile,
      overwriteChain(),
      validateRequest,
      fileController.overwriteLarge
    )
    .get(
      "/download/:id",
      authenticate,
      downloadChain(),
      validateRequest,
      fileController.download
    )
    .delete("/delete", deleteChain(), validateRequest, fileController.delete)
    .put(
      "/update",
      authenticate,
      uploadLarge.single("file"),
      validateFile,
      downloadChain(),
      validateRequest,
      fileController.update
    )
    .post(
      "/copy",
      authenticate,
      copyChain(),
      validateRequest,
      fileController.copy
    )
    .put(
      "/move",
      authenticate,
      copyChain(),
      validateRequest,
      fileController.move
    )
    .patch(
      "/rename",
      authenticate,
      renameChain(),
      validateRequest,
      fileController.rename
    );

  router.use(fileInfoErrorHandler);

  return router;
};

const getFilesChain = () => [
  param("storageId").notEmpty().withMessage("Хранилище должно быть выбрано!"),
  param("parentId").optional(),
];
const uploadChain = () => [
  body("storageId").notEmpty().withMessage("Storage id must be defined!"),
  body("name").notEmpty().withMessage("Name must be defined!"),
];
const overwriteChain = () => [
  body("id").notEmpty().withMessage("Name must be defined!"),
];
const deleteChain = () => [
  body("id").notEmpty().withMessage("File id must be defined!"),
];
const downloadChain = () => [
  param("id").notEmpty().withMessage("File id must be defined!"),
];
const copyChain = () => [
  body("id").notEmpty().withMessage("File id must be defined!"),
  body("parentId").optional(),
];
const renameChain = () => [
  body("id").notEmpty().withMessage("Файл должен быть определён!"),
  body("name").notEmpty().withMessage("Название не может быть пустым!"),
];

export default createRouter;
