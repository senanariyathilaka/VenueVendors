import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Vendor } from "./entity/vendorEntity";
import { Hirer } from "./entity/hirerEntity";
import { Venue } from "./entity/venueEntity";
import { Application } from "./entity/applicationEntity";
import { VenuePreference } from "./entity/venuePreferenceEntity";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 1433),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: true,
  entities: [Vendor, Hirer, Venue, Application, VenuePreference],
  migrations: [],
  subscribers: [],
  options: {
    encrypt: true,
  },
});