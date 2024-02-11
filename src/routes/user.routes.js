import { Router } from "express";
import registerUser from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"; //for adding the file handling functionality

const userRouter = Router();

//user router is telling if the user visits the /register route
//then call the registerUser controller method

//here we have injecting multer middleware just before the registerUser controller to use file
//inside the request, as body can't have the files. 
userRouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

export default userRouter;
