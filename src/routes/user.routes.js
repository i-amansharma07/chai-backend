import { Router } from "express";
import {
  registerUser,
  loginUser,
  otpValidation,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserBasicInfo,
  changeAvatar,
  changeCover,
  getUserChannelProfile,
  getUserWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"; //for adding the file handling functionality
import { verifyJwt } from "../middleware/auth.middleware.js";

const userRouter = Router();

//user router is telling if the user visits the /register route
//then call the registerUser controller method

//here we have injecting multer middleware just before the registerUser controller to use file
//inside the request, as body can't have the files.
userRouter.route("/register").post(
  //This defines a route for handling POST requests to the "/api/v1/users/register" endpoint.
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

//express will give (req,res,next) params to each function inside the post method
userRouter.route("/login").post(loginUser);

userRouter.route("/verify_otp").post(otpValidation);

/******  protected(secured) routes [when user is logged in] ******/
userRouter.route("/logout").post(verifyJwt, logoutUser);

userRouter.route("/refresh_access_token").post(refreshAccessToken);

userRouter.route("/change_password").post(verifyJwt, changeCurrentPassword);

userRouter.route("/get_current_user").get(verifyJwt, getCurrentUser);

//patch request as we want to update only some fileds not the entire document
userRouter
  .route("/update_user_basic_info")
  .patch(verifyJwt, updateUserBasicInfo);

userRouter
  .route("/change_avatar")
  .patch(upload.single("avatar"), verifyJwt, changeAvatar);

userRouter
  .route("/change_cover")
  .patch(upload.single("coverImage"), verifyJwt, changeCover);

//giviing user name in params  
userRouter
.route("/channel/:userName")  
.get(verifyJwt, getUserChannelProfile)

userRouter
.route("/watch-history")
.get(verifyJwt, getUserWatchHistory)

export default userRouter;

/*
registerUser is the function that is registered as the handler 
for the POST request to the "/api/v1/users/register" endpoint. When a
POST request is made to that endpoint,Express will call the registerUser 
function to handle the request and pass request and response object to it.
*/
