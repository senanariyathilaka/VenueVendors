import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Venue } from "./venueEntity";

@Entity("vendor")
export class Vendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "nvarchar", length: 255 })
  name!: string;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "nvarchar", length: 255 })
  password!: string;

  @Column({ type: "nvarchar", length: 255, default: "" })
  venue!: string;

  @OneToMany(() => Venue, (venue) => venue.vendor)
  venues!: Venue[];
}