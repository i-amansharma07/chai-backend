import { Router } from "express";
import {registerUser,loginUser,logoutUser, refreshAccessToken} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js"; //for adding the file handling functionality
import {verifyJwt} from '../middleware/auth.middleware.js'

const userRouter = Router();

//user router is telling if the user visits the /register route
//then call the registerUser controller method

//here we have injecting multer middleware just before the registerUser controller to use file
//inside the request, as body can't have the files. 
userRouter.route('/register').post( //This defines a route for handling POST requests to the "/api/v1/users/register" endpoint.
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


userRouter.route('/login').post(loginUser)


// protected(secured) routes [when user is logged in]

//express will give (req,res,next) params to each function inside the post method
userRouter.route('/logout').post(verifyJwt,logoutUser)

userRouter.route('/refresh_access_token').post(refreshAccessToken)

export default userRouter;


/*
registerUser is the function that is registered as the handler 
for the POST request to the "/api/v1/users/register" endpoint. When a
POST request is made to that endpoint,Express will call the registerUser 
function to handle the request and pass request and response object to it.
*/