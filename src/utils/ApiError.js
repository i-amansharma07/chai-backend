/******  STANDARISING API ERROR AND RESPONSE *******/

// This file is used to standardise the Error if occurred in the request's response
// to make some fields that are needed to be there in the error 


//node js gives us a whole Error class can be read on docs

class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something went wrong',
        errors = [],
        stack = ""
    ){
        super(message) //overriding message of parent
        this.statusCode = statusCode
        this.data = null, //assignment to find this data field
        this.message = message,
        this.success = false,
        this.errors = errors


        //below is written in production code
        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
} 

export default ApiError