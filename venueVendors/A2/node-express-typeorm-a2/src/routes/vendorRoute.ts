import { Router } from "express";
import {
  getAllVendors,
  getVendorByName,
  getVendorVenues,
  getVendorAnalytics
} from "../controller/vendorController";

const vendorRoute = Router();

vendorRoute.get("/vendors", getAllVendors);
vendorRoute.get("/vendors/search", getVendorByName);
vendorRoute.get("/vendors/:vendorId/venues", getVendorVenues);
vendorRoute.get("/vendors/:vendorId/analytics", getVendorAnalytics);
export default vendorRoute;