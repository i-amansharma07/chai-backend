import { uploadVideo } from "../controllers/video.controller.js";
import { Router } from "express";
import { upload } from "../middleware/multer.middleware.js"; 
import { verifyJwt } from "../middleware/auth.middleware.js";

const videoRouter = Router();


videoRouter
  .route("/uploadVideo")
  .post(upload.single("videoFile"), verifyJwt,uploadVideo);



export default videoRouter;  