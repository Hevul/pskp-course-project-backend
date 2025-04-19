import express from "express";
import User from "../../../../core/src/entities/User";

declare global {
  namespace Express {
    interface Response {
      good: (props?: { message?: string; code?: number }) => void;
      bad: (props?: { message?: string; code?: number }) => void;
      error400: (props: { errors: WebErrorFormat[] }) => void;
    }
    interface Request {
      user?: User;
      tempFile?: {
        path: string;
        size: number;
      };
      file?: Express.Multer.File;
      uploadingFileName?: string;
    }
  }
}
