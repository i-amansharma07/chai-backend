import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../model/user.model.js";

/* 
  Need of this MiddleWare ?
  We didn't have the user's info while logging it out so we needed a middleware which will make
  user's info present in every request object which are coming to a secured/loggedin/protected user,
  there can be many usecases in which we need to get a verified user or user details so we can use the req object user property

  Working of the MiddleWare ?
  * Firstly it will try to get the access token from the request object's cookies property or from the Authorization header
  * If the access token is not present then i will throw an error.
  * If the access token is present then it will try to decode the access token into a normal js object using a secret 
    access token key and the token we got from the request. (using await in decoding token is optional)
  * Once the token is decoded into normal js object we will get the _id from it and try to fing the user details from it
  * If the user is not present so we know the access token is not a valid access token and thow an error
  * If the user found then we add the user details into the request object
  * After all of this we call the next() function to execute the next middleware

*/

const verifyJwt = asyncHandler(async (req, _ , next) => {
  try {
    //how to access the token -> we will get the cookies from the req object
    //we are getting token either from cookies or header (mobile user)
    console.log(req);
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");


    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // if token is present now we need to verify whether the token is valid with db token or not
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //this decoded token is now a simple js object which will have a _id property
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    //now we add a user property to the request body
    req.user = user;
    //now we call the next middleware
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Something went wrong while verifying User"
    );
  }
});

export { verifyJwt };
