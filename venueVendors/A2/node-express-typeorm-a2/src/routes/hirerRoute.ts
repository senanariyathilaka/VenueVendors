import { Router } from "express";
import {
  addVendorComment,
  approveHirer,
  createApplication,
  getAllHirers,
  getHirerApplications,
  getHirerHistory,
  getHirerPreferences,
  getHirerProfile,
  getVenues,
  saveHirerPreferences,
  updateHirerProfile,
} from "../controller/hirerController";

const hirerRoute = Router();

hirerRoute.get("/hirers", getAllHirers);
hirerRoute.put("/hirers/:id/approve", approveHirer);
hirerRoute.post("/hirers/:id/comments", addVendorComment);

hirerRoute.get("/hirers/:id", getHirerProfile);
hirerRoute.put("/hirers/:id", updateHirerProfile);

hirerRoute.get("/venues", getVenues);

hirerRoute.get("/hirers/:id/preferences", getHirerPreferences);
hirerRoute.put("/hirers/:id/preferences", saveHirerPreferences);

hirerRoute.post("/hirers/:id/applications", createApplication);
hirerRoute.get("/hirers/:id/applications", getHirerApplications);
hirerRoute.get("/hirers/:id/history", getHirerHistory);

export default hirerRoute;