import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Vendor } from "./vendorEntity";
import { Application } from "./applicationEntity";
import { VenuePreference } from "./venuePreferenceEntity";

@Entity()
export class Venue {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

 
  @Column({ type: "nvarchar", length: 255, nullable: true })
  type!: string | null;

  @Column()
  location!: string;

  @Column()
  capacity!: number;

  @Column({ type: "datetime2", nullable: true })
  blockedDateFrom!: Date | null;

  @Column({ type: "datetime2", nullable: true })
  blockedDateTo!: Date | null;

  @Column({ default: "" })
  recommendedSuitability!: string;

  @Column({ type: "bit", default: false })
  isFeatured!: boolean;

  @ManyToOne(() => Vendor, (vendor) => vendor.venues, {
    nullable: true,
    onDelete: "SET NULL",
  })
  vendor!: Vendor | null;

  @OneToMany(() => Application, (application) => application.venue)
  applications!: Application[];

  @OneToMany(() => VenuePreference, (preference) => preference.venue)
  preferences!: VenuePreference[];
}