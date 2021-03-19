import {Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn} from "typeorm";
import {FavoriteQuote} from "./favorite.quote";
import {QuoteInterface} from "../models/quote.interface";


@Entity("quotes")
export class Quote {
    @PrimaryColumn({type: 'varchar', length: 1024})
    symbol: string;

    @CreateDateColumn({type: 'timestamp without time zone', default: 'NOW'})
    date: Date;

    @Column({type: 'decimal', precision: 17, scale: 8})
    price: number;

    @Column({type: 'decimal', precision: 17, scale: 8, default: 0.0})
    changePercent: number;

    @Column({type:'jsonb', default: '{}'})
    meta: QuoteInterface;

    @OneToMany(type => FavoriteQuote, favoriteQuote => favoriteQuote.quote)
    favorites: FavoriteQuote[];


}

