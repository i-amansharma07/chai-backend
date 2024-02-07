import { Router } from "express";
import registerUser from '../controllers/user.controller.js'


const userRouter = Router()
//user router is telling if the user visits the /register route 
//then call the registerUser controller method
userRouter.route('/register').post(registerUser)


export default  userRouter;