/* 
we will be writing try and catch block evrytime we will make some async call so it's better to make a wrapper
in which we pass our async function and it will execute that function in a safer ervnoironmet 

benefits : 
1. our async code will always run inside a safer environemtn i.e inside a try catch or resolve catch.
2. code reusability : we dont have to wrtie the same code agian and again for error handling.
*/


// industry practise uses promises way of doing this

const asyncHandler = (requestHandler) => {
    
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch(error => next(error))
    }
}

export default asyncHandler;


/**********************   using try and catch way    ***********************/

// const asyncHandler = (func) => async (req,res,next) =>{
//     try {
//         await func(req,res,next)
//     } catch (error) {
//        // we will send the error status and the json body with it 
//        res.status(error.code || 500).json({
//         success : false,
//         message : error.message
//        })
//     }
// }








