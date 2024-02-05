import multer from "multer";

/*
    this middleware will be used when we have received the file from https req now we need 
    to save it on local storage of our server and retrieve the file path of it.

    GPT -
    Multer's Role: Multer is a middleware for Express.js (and other Node.js frameworks) 
    that is specifically designed to handle multipart/form-data requests.
     It can parse and handle the incoming data, making it easy to manage file uploads in 
     your server-side code.
*/

// here we are using ssd/hdd of the server not the ram (memory of the server) for memory full error prevention
const storage = multer.diskStorage({
  // req body dont have file in body that is why we have multer to have file option. (body usually have the json data no file option)
  destination: function (req, file, cb) {
    //here first param is asking the way how it should handle the error for not it's null and second param is to give the destination folder to the file to be saved.
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    //log(file) will se in future.
    cb(null, file.originalname); // not a good practise will have some suffix later.
  },
});


export const upload = multer({
  storage, // in es-6 this is the shorthand (storage : storage) if key and value are same
});
