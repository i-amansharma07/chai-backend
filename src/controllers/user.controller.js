import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js"; //this User will talk with mongoDB
import uploadOnCloudinary from '../utils/cloudinary.js'
import ApiResponse from '../utils/ApiResponse.js'

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
  const { userName, fullName, email, password, avatar, coverImage } = req.body;

  //step 2 : validaity of fields
  if (
    [userName, fullName, email, password, avatar].some(
      (field) => field?.trim() === ""
    )
  ) {
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
  const avatarLocalPath = await req?.files?.avatar[0]?.path;
  // const coverLocalPath = await req?.files?.coverImage[0]?.path; // this will cause error while uploading user with no coverImage (core js drawback in optional chaining)

  //below is the more porfessional way of checking the data availability
  let coverLocalPath;
  if(req && req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverLocalPath = await req?.files?.coverImage[0]?.path;
  }

  //as avatar is mandatory i.e why we need to check it before uploading
  if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar File is required')
  }

  //as we have already written the cloudinary part we can directly use it
  const avatarUpload =  await uploadOnCloudinary(avatarLocalPath)

  if(!avatarUpload){
    throw new ApiError(500,'Something Went Wrong while uploading avatar please try again')
  }

  const coverImageUpload = await uploadOnCloudinary(coverLocalPath)


  //step 5 : storing user in the db with hashed pass (password will be hashed automatically as we have pre hook)
  const user = await User.create({
    fullName,
    email,
    avatar : avatarUpload.url,
    coverImage : coverImageUpload?.url || '',
    password,
    userName : userName.toLowerCase()
  })

  //step 6 & 7 : checking if the user has been stored into db or not then excluding the pass and refresh token field
  //mongo automatically assigns _id to each entry so we can directly check this.

  const createdUser = await User.findById(user._id).select(
    '-passowrd -refreshToken'
  )

  if(!createdUser){
    throw new ApiError(500,'Something went wrong while registering the user')
  }

  //step 8 : returning the response to the user by our ApiResponse class.
  return res.status(201).json(new ApiResponse(200,createdUser,'User Has been created successfully'))

});

export default registerUser;
