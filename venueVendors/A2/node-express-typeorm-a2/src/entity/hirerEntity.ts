import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Application } from "./applicationEntity";
import { VenuePreference } from "./venuePreferenceEntity";

@Entity("hirer")
export class Hirer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: string;

  // This column will store the hashed password once signup/login is connected.
  @Column({ type: "nvarchar", length: 255 })
  password!: string;

  @Column({ type: "nvarchar", length: 30, default: "" })
  phone!: string;

  @Column({ type: "nvarchar", length: 500, default: "" })
  comments!: string;

  @Column({ type: "int", default: 0 })
  rating!: number;

  @Column({ type: "nvarchar", length: 255, default: "" })
  requirements!: string;

  @Column({ type: "int", default: 0 })
  approvalCount!: number;

  @CreateDateColumn({ type: "datetime2" })
  dateJoined!: Date;

  // This is the correct way to include applications for a hirer.
  @OneToMany(() => Application, (application) => application.hirer)
  applications!: Application[];

  @OneToMany(() => VenuePreference, (preference) => preference.hirer)
  preferences!: VenuePreference[];
}