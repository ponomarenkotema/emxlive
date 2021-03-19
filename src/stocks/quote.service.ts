import {Inject, Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {InsertResult, Repository} from "typeorm";
import {Quote} from "./entity/quote";
import {FavoriteQuote} from "./entity/favorite.quote";
import {Network} from "../users/entity/profile";
import {StocksService} from "./stocks.service";
import {QuoteInterface} from "./models/quote.interface";


@Injectable()
export class QuoteService {

    constructor(
        @InjectRepository(Quote)
        private readonly quoteRepository: Repository<Quote>,
        @InjectRepository(FavoriteQuote)
        private readonly favoriteQuoteRepository: Repository<FavoriteQuote>,
        private readonly stocksService: StocksService
    ) {
    }

    async getAllQuotes(): Promise<Quote[]> {
        return this.quoteRepository.find({
            cache: true, relations: ['favorites', 'favorites.profile']
        });
    }

    async addQuoteToFavorites(network: Network, profileId: string, symbol: string): Promise<InsertResult> {
        let quote = await this.getQuote(symbol);
        if (!quote) {
            const quoteInterface = await this.stocksService.getQuote(symbol);
            quote = quote || new Quote();
            quote.symbol = quoteInterface.symbol;
            quote.price = parseFloat(quoteInterface.price);
            quote.changePercent = 0;
            quote.meta = quoteInterface;
            await this.quoteRepository.createQueryBuilder()
                .insert()
                .into(Quote)
                .values(quote)
                .onConflict(`("symbol") DO NOTHING`)
                .execute();
        }
        const favoriteQuote = new FavoriteQuote();
        favoriteQuote.profileNetwork = network;
        favoriteQuote.profileId = profileId;
        favoriteQuote.quoteSymbol = symbol;
        return await this.favoriteQuoteRepository.createQueryBuilder()
            .insert()
            .into(FavoriteQuote)
            .values(favoriteQuote)
            .onConflict(`("profileId", "profileNetwork", "quoteSymbol") DO NOTHING`)
            .returning('*')
            .execute();
    }

    async getQuote(symbol: string): Promise<Quote> {
        return this.quoteRepository.findOne(symbol);
    }

    async updateQuote(symbol: string): Promise<Quote> {
        const quote = await this.quoteRepository.findOne(symbol);
        const quoteInterface = await this.stocksService.getQuote(symbol);
        quote.changePercent = parseFloat((Math.abs(1 - quote.price / parseFloat(quoteInterface.price)) * 100).toFixed(2));
        quote.price = parseFloat(parseFloat(quoteInterface.price).toFixed(2));
        quote.meta = quoteInterface;
        return this.quoteRepository.save(quote);
    }

    async removeQuoteFromFavorites(profileNetwork: Network, profileId: string, symbol: string) {
        return await this.favoriteQuoteRepository.createQueryBuilder().delete()
            .from(FavoriteQuote)
            .where("profileNetwork = :profileNetwork AND profileId = :profileId AND quoteSymbol = :symbol",
                {symbol: symbol, profileNetwork: profileNetwork, profileId: profileId})
            .execute();
    }

    async setFavoriteQuoteAlertThreshold(profileNetwork: Network, id: any, symbol: any, threshold: number) {
        const favoriteQuote = await this.favoriteQuoteRepository.findOne({
            profileId: id,
            profileNetwork: profileNetwork,
            quoteSymbol: symbol
        });
        favoriteQuote.alertThreshold = threshold;
        return this.favoriteQuoteRepository.save(favoriteQuote);
    }
}
