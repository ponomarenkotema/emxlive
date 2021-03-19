import {QuoteType} from "./quote.type";

export interface QuoteInterface {
    exchange: string,
    shortname: string,
    longname: string,
    quoteType: QuoteType,
    symbol: string,
    currency: string,
    lastRefreshedDate: number,
    previousClose: string,
    open: string,
    high: string,
    low: string,
    price: string,
    change: string,
    changePercent: string
}
