import {QuoteType} from "./quote.type";

export interface SearchQuoteInterface {
    exchange: string,
    shortname: string,
    longname: string,
    quoteType: QuoteType,
    symbol: string
}
