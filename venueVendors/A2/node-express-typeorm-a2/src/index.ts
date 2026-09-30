import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import vendorRoute from "./routes/vendorRoute";
import authRoute from "./routes/authRoute";
import hirerRoute from "./routes/hirerRoute";
import venueRoute from "./routes/venueRoute";
import { seedInitialData } from "./seed/seedData";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", authRoute);
app.use("/api", vendorRoute);
app.use("/api", venueRoute);
app.use("/api", hirerRoute);

AppDataSource.initialize()
  .then(async () => {
    await seedInitialData();

    console.log("Data Source has been initialized!");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("Error during Data Source initialization:", error);
  });