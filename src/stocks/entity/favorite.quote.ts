import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Network, Profile} from "../../users/entity/profile";
import {Quote} from "./quote";

@Entity("favorite_quote")
@Index(["profileId", "profileNetwork", "quoteSymbol"], {unique: true})
export class FavoriteQuote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 1024, default: null, nullable: true})
    profileId: string;

    @Column({
        type: 'varchar',
        length: 64,
        default: "telegram"
    })
    profileNetwork: Network;

    @Column({type: 'varchar', length: 1024, nullable: false})
    quoteSymbol: string;

    @Column({type: 'decimal', precision: 5, scale: 2, default: 1.0})
    alertThreshold: number;

    @ManyToOne(type => Quote, quote => quote.favorites)
    quote: Quote;

    @ManyToOne(type => Profile, profile => profile.favorites)
    profile: Profile;


}
