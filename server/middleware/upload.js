import multer from "multer";

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
  const err = new Error("Only JPG, PNG or WebP images are allowed");
  err.statusCode = 400;
  cb(err);
};

export const uploadImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 3 },
}).array("images", 3);