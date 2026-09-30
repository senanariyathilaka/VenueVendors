import { Router } from "express";
import { getProfile, loginUser, signupUser } from "../controller/authController";

const authRoute = Router();

authRoute.post("/auth/signup", signupUser);
authRoute.post("/auth/login", loginUser);
authRoute.get("/auth/profile/:role/:id", getProfile);

export default authRoute;
