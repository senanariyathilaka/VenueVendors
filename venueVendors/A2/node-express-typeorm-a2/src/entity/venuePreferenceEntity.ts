import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Hirer } from "./hirerEntity";
import { Venue } from "./venueEntity";

@Entity("venue_preference")
@Unique(["hirer", "venue"])
export class VenuePreference {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Hirer, (hirer) => hirer.preferences, { nullable: false })
  hirer!: Hirer;

  @ManyToOne(() => Venue, (venue) => venue.preferences, { nullable: false })
  venue!: Venue;

  @Column({ type: "int" })
  preferenceRank!: number;
}