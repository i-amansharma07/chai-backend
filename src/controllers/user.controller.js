import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js"; //this User will talk with mongoDB
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

function validateFields(fieldsArray) {
  return fieldsArray.some(
    (field) => field?.trim() === "" || typeof field === "undefined"
  );
}

//this will be handy in generating the refresh and access token both.
async function generateAccessAndRefreshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //saving the refreshToken inside the mongo db user's object
    user.refreshToken = refreshToken;
    //because user model will try to find password and we
    //are just sending the refresh token, so we tell mongoose to not call pre middleware while doing this operation
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
}

//this method will only register the user
const registerUser = asyncHandler(async (req, res) => {
  /*
    Steps to register a user
    1. Get the Data from the frontend/postman.
    2. validate all the filed whether requied fields are present or not (like the userName, password, email, avatar and all)
    3. check if username or email exists or not.
    4. After validation upload the avatar and cover images to the cloudinary and if some error comes up then abort the process and tell user to try again later.
    5. After all the upload part completion store the user with hashed passowrd into the db.
    6. Once the user is stored inside the db try to call the user to check whether user has been saved/created or not (extra step for safety purpose)
    7. Now creat a user object by removing the password and refresh token filed and send it back to the user.
    8. return this user to the client in response.
  */

  //step 1 : received all the data from the request body (with object destructuring)
  const { userName, fullName, email, password } = req.body;

  //step 2 : validaity of fields
  if (validateFields([userName, fullName, email, password])) {
    throw new ApiError(400, "Please fill all the required fields");
  }

  //step 3 : check existing user for email and userName
  //we will use operators here to check two fileds in db
  const isExisting = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (isExisting) {
    throw new ApiError(409, "This username or email is already taken");
  }

  //step 4 : upload image files to cloudinary
  //here multer has saved the image on our server and will give the filepath of that file
  //console.log(req.file) in future
  let avatarLocalPath;
  if (
    req &&
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = await req?.files?.avatar[0]?.path;
  }

  // const coverLocalPath = await req?.files?.coverImage[0]?.path; // this will cause error while uploading user with no coverImage (core js drawback in optional chaining)

  //below is the more porfessional way of checking the data availability
  let coverLocalPath;
  if (
    req &&
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverLocalPath = await req?.files?.coverImage[0]?.path;
  }

  //as avatar is mandatory i.e why we need to check it before uploading
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  //as we have already written the cloudinary part we can directly use it
  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarUpload) {
    throw new ApiError(
      500,
      "Something Went Wrong while uploading avatar please try again"
    );
  }

  const coverImageUpload = await uploadOnCloudinary(coverLocalPath);

  //step 5 : storing user in the db with hashed pass (password will be hashed automatically as we have pre hook)
  const user = await User.create({
    fullName,
    email,
    avatar: avatarUpload.url,
    coverImage: coverImageUpload?.url || "",
    password,
    userName: userName.toLowerCase(),
  });

  //step 6 & 7 : checking if the user has been stored into db or not then excluding the pass and refresh token field
  //mongo automatically assigns _id to each entry so we can directly check this.

  const createdUser = await User.findById(user._id).select(
    "-passowrd -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  //step 8 : returning the response to the user by our ApiResponse class.
  return res
    .status(201)
    .json(
      new ApiResponse(200, createdUser, "User Has been created successfully")
    );
});

const loginUser = asyncHandler(async (req, res) => {
  /* 
  step 1 : Take data from req body.
  step 2 : Validate fileds like empty or not.
  step 3 : After this make a db call to check whether this user exists in db or not, if not then throw an error with a 'user not found' 
           message and if exists then move to next step
  step 4 : Now match the password of the user if it dont matches with the db pass then thow error with a message 'password doens't macth, try again'
           if it matches then move to next step           
  step 5 : Generate refersh token and access token for the user and save this refresh token inside the user collection inside the mongodb.
  step 6 : Send cookies with all the info to client.
*/

  //step 1 :
  const { userName, email, password } = req.body;

  //step 2 :
  if (validateFields([userName, email, password])) {
    throw new ApiError(400, "Please fill all the required fields");
  }

  //step 3 :
  // user can either type UserName or email to login
  const user = await User.findOne({
    $or: [{ userName, email }],
  });

  if (!user) {
    throw new ApiError(404, "User with this username or email is not found");
  }

  //step 4 :
  // User is mongoose object with findOne updateOne function, we will get pass from user that has been fetched from the mongo db.
  const isPassCorrect = await user.isPasswordCorrect(password);

  if (!isPassCorrect) {
    throw new ApiError(401, "The entered password does not matches");
  }

  //step 5 :
  //this operation may need some time so we need to await this
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //step 6 : Send the response in cookies
  // we need to again fetch the user from the db as the user fetched in step 3 is the older refrence with empty refresh token
  // either we can alter the previous user or fetch a new user from db depends upon the requirements
  const loggedInUser = await User.findById(user._id).select(
    "-passowrd -avatar -refreshToken -coverImage -watchHistory"
  );

  // newUser[accesToken] = accessToken

  //now we are writing code for cookies
  //by default cookies can be changed by the front end but we are making it to be changed by backend via http call
  const options = {
    httpOnly: true,
    secure: true,
  };

  // we are sending access and refresh token in cookies and response as well, the client can be a mobile user
  // so cookies wont work there or even in browser if front end wants to store it in local storage then that can with response values
  //the only reason we can add cookies are that we have added cookie-parser as a middleware in our app.js
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  /*
    How can we logout a user ?
    -> we have to delete the cookies from the client's browser
    -> we also have to delete the refresh token from the mongo db user's object 
       (for this we need to get a refrece of the user but here we don't have the email/userName of the user 
       (assuming frontend dont pass the user's email) so we need to write our own middleware for it which will only 
       verify (jwt) is this user authorized or not)
  */

  const userId = req.user._id;

  //here we will find the user and then update (clear) the refreshToken
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // from here we will get the new updated value not the old one
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
});

// this is the end point where frontend dev will hit to renew their access token which will renew and save refresh token in db as well and return access and refresh token in cookies and response body
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh Token Not Found");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(400, "Refresh Token Invalid");
  }

  // console.log(decodedToken._id);

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    decodedToken._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "New Access Token Generated"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (validateFields([oldPassword, newPassword])) {
    throw new ApiError("400", "Please fill all the required fields");
  }

  const user = await User.findById(userId);

  const isPassCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPassCorrect) {
    throw new ApiError(
      401,
      "Your old Password does not matches, please try again"
    );
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Updated Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: req.user }, "user fetched"));
});

const updateUserBasicInfo = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  console.log(user);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { user }, "User Basic Info Updated Successfully")
    );
});

// it's a industry practise to let user update text info and file info in diff routes
// to avoid payload excess size
const changeAvatar = asyncHandler(async (req, res) => {
  /*
   1. receive file from the req object 
   2. validate the filed.
   3. upload the filed on cloudinary then get the url for it.
   4. save the url into avatar property in user object of db.
   5. return the response with success message. 
  */


  let avatarLocalPath;
  if (req && req.file) {
    avatarLocalPath = await req.file.path;
  } else {
    throw new ApiError(400, "Please Provide the Avatar Image");
  }

  const avatarUpload = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarUpload) {
    throw new ApiError(
      500,
      "Something Went Wrong while uploading avatar please try again"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatarUpload.url,
      },
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        url: user.avatar,
      },
      "Avatar Image has been Uploaded"
    )
  );
});

const changeCover = asyncHandler(async (req, res) => {
  /*
   1. receive file from the req object 
   2. validate the filed.
   3. upload the filed on cloudinary then get the url for it.
   4. save the url into avatar property in user object of db.
   5. return the response with success message. 
  */


  let coverLocalPath;
  if (req && req.file) {
    coverLocalPath = await req.file.path;
  } else {
    throw new ApiError(400, "Please Provide the Avatar Image");
  }

  const coverUpload = await uploadOnCloudinary(coverLocalPath);

  if (!coverUpload) {
    throw new ApiError(
      500,
      "Something Went Wrong while uploading avatar please try again"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverUpload.url,
      },
    },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        url: user.coverImage,
      },
      "Cover image has been Uploaded"
    )
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserBasicInfo,
  changeAvatar,
  changeCover
};
