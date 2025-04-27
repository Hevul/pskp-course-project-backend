import express, { RequestHandler } from "express";
import { FileController } from "../controllers/FileController";
import validateFile from "../middlewares/validators/requireFile";
import { body, param } from "express-validator";
import validateRequest from "../middlewares/validators/validateRequest";
import fileInfoErrorHandler from "../errorHandlers/handlers/fileInfoErrorHandler";
import { uploadCleanup } from "../middlewares/utils/uploadCleanup";
import { uploadLarge } from "../utils/multerConfig";
import { createAuthorizeMiddlewareFactory } from "../middlewares/utils/createAuthorizeMiddlewareFactory";

const createRouter = (
  authenticate: RequestHandler,
  authorize: ReturnType<typeof createAuthorizeMiddlewareFactory>,
  fileController: FileController
) => {
  const router = express.Router();

  router
    .get(
      "/get/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      getChain(),
      validateRequest,
      fileController.get
    )
    .get(
      "/view/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      fileController.view
    )
    .get(
      "/get-all-by-storage/:storageId/:parentId?",
      authenticate,
      authorize({
        entityTypes: {
          storageId: "storage",
        },
        idLocations: ["params"],
        idFields: ["storageId"],
      }),
      getFilesChain(),
      validateRequest,
      fileController.getAllByStorageId
    )
    .post(
      "/upload",
      uploadLarge.single("file"),
      authenticate,
      authorize({
        entityTypes: {
          storageId: "storage",
        },
        idLocations: ["body"],
        idFields: ["storageId"],
      }),
      validateFile,
      uploadCleanup,
      fileController.upload
    )
    .post(
      "/confirm-overwrite",
      authenticate,
      authorize({
        entityTypes: {
          existingFileId: "file",
        },
        idLocations: ["body"],
        idFields: ["existingFileId"],
      }),
      validateRequest,
      fileController.confirmOverwrite
    )
    .get(
      "/download/:id",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
        },
        idLocations: ["params"],
        idFields: ["id"],
      }),
      downloadChain(),
      validateRequest,
      fileController.download
    )
    .delete(
      "/delete",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      deleteChain(),
      validateRequest,
      fileController.delete
    )
    .post(
      "/copy",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
          parentId: "dir",
        },
        idLocations: ["body"],
        idFields: ["id", "parentId"],
      }),
      copyChain(),
      validateRequest,
      fileController.copy
    )
    .put(
      "/move",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
          parentId: "dir",
        },
        idLocations: ["body"],
        idFields: ["id", "parentId"],
      }),
      copyChain(),
      validateRequest,
      fileController.move
    )
    .patch(
      "/rename",
      authenticate,
      authorize({
        entityTypes: {
          id: "file",
        },
        idLocations: ["body"],
        idFields: ["id"],
      }),
      renameChain(),
      validateRequest,
      fileController.rename
    );

  router.use(fileInfoErrorHandler);

  return router;
};

const getChain = () => [];
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
