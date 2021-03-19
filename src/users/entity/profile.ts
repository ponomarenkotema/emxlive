import {Column, Entity, Index, JoinTable, ManyToMany, OneToMany, PrimaryColumn} from "typeorm";
import {Chat} from "./chat";
import {Quote} from "../../stocks/entity/quote";
import {FavoriteQuote} from "../../stocks/entity/favorite.quote";

export enum Network {
    TELEGRAM = "telegram"
}

export enum Locale {
    en = "en",
    ru = "ru"
}

@Entity("profiles")
@Index(["id", "network"], {unique: true})
export class Profile {
    @PrimaryColumn()
    id: string;

    @PrimaryColumn({
        type: 'varchar',
        length: 64,
        default: Network.TELEGRAM
    })
    network: Network;

    @Column({type: 'varchar', length: 64, default: null, nullable: true})
    phone: string;

    @Column({type: 'varchar', length: 64})
    name: string;

    @Column({type: 'varchar', length: 1024, default: null, nullable: true})
    username: string;

    @Column({type: 'varchar', length: 8})
    locale: Locale;

    @Column({type: 'varchar', length: 8, default: '+03:00'})
    timezone: string;

    @Column({type: 'varchar', length: 64, default: 'DEFAULT'})
    bot: string;

    @Column('timestamp without time zone', {
        name: 'createdAt',
        nullable: true,
        default: () => 'now()',
    })
    createdAt?: Date | null;

    @OneToMany(type => Chat, chat => chat.profile)
    chats: Chat[];

    @OneToMany(type => FavoriteQuote, favoriteQuote => favoriteQuote.profile)
    favorites: FavoriteQuote[];
}
