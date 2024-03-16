import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import { structuredError } from "../utils/utilFunctions.js";
import { User } from "../model/user.model.js";

const uploadVideo = asyncHandler(async (req, res) => {
  let videoLocalPath;
  if (req && req.file) {
    videoLocalPath = await req.file.path;
  }

  if (!videoLocalPath) {
    const error = new ApiError(400, "Please Provide Video File to upload");
    return structuredError(res, error);
  }

  const videoUpload = await uploadOnCloudinary(videoLocalPath);

  if (!videoUpload) {
    const error = new ApiError(
      500,
      "Something Went Wrong while uploading vidfeo please try again"
    );
    return structuredError(res, error);
  } 

  const userId = req.user._id;

  const user = await User.findById(userId);

  if(!user){
    const error = new ApiError(500, "Error While fetching user from db")
    return structuredError(res, error)
  }

  user.watchHistory.push(videoUpload?.url)

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        201,
        { url: videoUpload?.url },
        "Video Recieved Successfully"
      )
    );
});

export { uploadVideo };
