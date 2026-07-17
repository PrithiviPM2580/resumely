import multer from "multer";
import { APIError } from "../utils/api-error";
import type { Request, Response } from "express";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(req, file, callback) {
    if (file.mimetype !== "application/pdf") {
      return callback(APIError.BadRequest("Only PDF files are allowed"));
    }
    callback(null, true);
  },
});

export const uploadPdf =
  (field: string = "file") =>
  (req: Request, res: Response, next: Function) => {
    upload.single(field)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(
            APIError.BadRequest(
              `File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
            ),
          );
        }
        return next(APIError.BadRequest(err.message));
      }

      if (err) return next(err);
      if (!req.file) return next(APIError.BadRequest("No file uploaded"));
      next();
    });
  };
