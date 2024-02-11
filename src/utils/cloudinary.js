import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'

/* 
-> When the client uploads the file into our local storage of server then this file comes into picture
-> We will receive a local file path then we grab that file and upload it on coudinary with the help of multer
-> once the file is uploaded we unlink(remove) the file from our server's local storage.
*/

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});


// this operation could result in some runtime exceptions that is why try catch is must here.
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    //upload the file on cloudinary if file path exists.
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    if(response){
      fs.unlinkSync(localFilePath)
    }
    // console.log(response); {will see the response in console in future}

    //file as been uploaded successfully
    // console.log("file has been uploaded on cloudinary", response.url);

    return response;
  } catch (error) {
    /* if this block is getting executed then it means 
      there is some error in uploading the file which means file is in our local storage\
      which is needed to be removed 
    */
   fs.unlinkSync(localFilePath)
   console.log(error);
   return null
  }
};


export default uploadOnCloudinary;