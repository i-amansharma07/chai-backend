import asyncHandler from "../utils/asyncHandler.js";

//this method will only register the user
const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
      message: "ok",
    });
});

export default registerUser;
