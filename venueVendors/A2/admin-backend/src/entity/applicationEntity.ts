import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Hirer } from "./hirerEntity";
import { Venue } from "./venueEntity";

@Entity("application")
export class Application {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hirer, (hirer) => hirer.applications, { nullable: false })
  hirer!: Hirer;

  @ManyToOne(() => Venue, (venue) => venue.applications, { nullable: false })
  venue!: Venue;

  @Column({ type: "nvarchar", length: 255 })
  eventName!: string;

  @Column({ type: "int" })
  expectedGuests!: number;

  @Column({ type: "datetime2" })
  bookingStart!: Date;

  @Column({ type: "datetime2" })
  bookingEnd!: Date;

  @Column({ type: "int" })
  durationHours!: number;

  @Column({ type: "nvarchar", length: 50, default: "Pending" })
  status!: string;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  vendorComments!: string | null;

  @Column({ type: "int", nullable: true })
  vendorRating!: number | null;

  @CreateDateColumn({ type: "datetime2" })
  createdAt!: Date;
}