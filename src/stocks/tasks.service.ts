import {HttpService, Injectable, Logger} from '@nestjs/common';
import {Cron, CronExpression} from '@nestjs/schedule';
import {ConfigService} from '@nestjs/config';
import {SubscriptionInterface} from './models/subscription.interface';
import {Telegraf, Telegram} from 'telegraf';
import * as moment from 'moment-timezone';
import * as Twitter from 'twit';
import {StocksService} from "./stocks.service";
import {SubscriptionType} from "./models/subscription.type";
import {QuoteService} from "./quote.service";
import {i18nService} from "../common/i18n.service";
import {EmxliveTemplates} from "../emxlive/emxliveTemplates";

const T = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token: '',
    access_token_secret: ''
});

@Injectable()
export class TasksService {
    private readonly logger = new Logger(TasksService.name);
    private readonly stocksService: StocksService;
    private readonly quoteService: QuoteService;
    private httpService: HttpService;
    private readonly subscriptions: Array<SubscriptionInterface>;
    private readonly config: ConfigService;
    private emxliveTelegram: Telegram;
    private i18n: i18nService;

    constructor(config: ConfigService, i18n: i18nService, httpService: HttpService, stocksService:
        StocksService, quoteService: QuoteService) {
        this.config = config;
        this.subscriptions = config.get('subscriptions');
        this.httpService = httpService;
        this.stocksService = stocksService;
        this.quoteService = quoteService;
        this.emxliveTelegram = (new Telegraf(config.get('emxliveTelegram.token'))).telegram;
        this.i18n = i18n;
    }

    @Cron(CronExpression.EVERY_DAY_AT_NOON)
    async handleDailyCron() {
        this.logger.debug('Process EVERY_DAY subscriptions task triggered');
        //const dailySubscriptions = this.subscriptions.filter(s => s.cron === 'EVERY_DAY');
        //return this.processSubscriptions(dailySubscriptions);
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleTickerCron() {
        this.logger.log('Process EVERY_HOUR alert ticker task triggered');
        const quotes = await this.quoteService.getAllQuotes();
        for (const quote of quotes) {
            let updateQuote;
            try {
                updateQuote = await this.quoteService.updateQuote(quote.symbol);
            } catch (e) {
                console.error(e);
                continue;
            }
            if (!quote.favorites || !quote.favorites.length) {
                continue;
            }
            const chartLink = await this.stocksService.getQuoteChartLink(quote.symbol);
            for (const favoriteQuote of quote.favorites) {
                if (favoriteQuote.alertThreshold <= updateQuote.changePercent) {
                    let ctx = {i18n: this.i18n};
                    ctx.i18n.setLocale(favoriteQuote.profile.locale);
                    if (process.env.SKIP_OUTGOING_NOTIFICATIONS) {
                        this.logger.debug(`Skip sending ${quote.symbol} alert to ${favoriteQuote.profile.id}`);
                        continue;
                    }
                    try {
                        if (favoriteQuote.profile.bot === 'EMXLIVE') {
                            await this.emxliveTelegram.sendPhoto(favoriteQuote.profile.id, chartLink, {
                                caption: EmxliveTemplates.quoteDetails(updateQuote.meta, favoriteQuote, favoriteQuote.profile, ctx),
                                parse_mode: 'HTML',
                                reply_markup: EmxliveTemplates.quoteDetailsInlineMenu(quote.symbol, favoriteQuote, ctx)
                            });
                        }
                    } catch (e) {
                        console.error(e);
                        continue;
                    }
                }
            }
        }
        return Promise.resolve();
    }

    private async processSubscriptions(subscriptions: Array<SubscriptionInterface>) {
        for (const subscription of subscriptions) {
            try {
                if (subscription.type === SubscriptionType.SPREAD) {
                    await this.processSpreadSubscription(subscription);
                }
                if (subscription.type === SubscriptionType.PORTFOLIO) {
                    await this.processPortfolioSubscription(subscription);
                }
                await TasksService.waitFor(10000);
            } catch (e) {
                console.error(e);
            }
        }
        return Promise.resolve();
    };

    private async processPortfolioSubscription(subscription: SubscriptionInterface) {
        this.logger.debug(`Process ${subscription.symbol} subscription.`);
        let quotes = [];
        for (const stock of subscription.stocks) {
            quotes.push(await this.stocksService.getQuote(stock.symbol));
        }
        const portfolioData = await this.stocksService.getPortfolioSubscriptionData(subscription.symbol, null);
        if (process.env.SKIP_OUTGOING_NOTIFICATIONS) {
            this.logger.debug(`Skip ${subscription.symbol} twitter post`);
            return Promise.resolve();
        }
        try {
            await this.postPortfolioTweet(subscription, quotes, portfolioData);
        } catch (e) {
            console.error(e);
        }
        return Promise.resolve();
    }

    private async processSpreadSubscription(subscription: SubscriptionInterface) {
        this.logger.debug(`Process ${subscription.symbol} subscription.`);
        let quotes = [];
        for (const stock of subscription.stocks) {
            quotes.push(await this.stocksService.getQuote(stock.symbol));
        }
        const chartLink = await this.stocksService.getSubscriptionChartLink(subscription.symbol);
        if (process.env.SKIP_OUTGOING_NOTIFICATIONS) {
            this.logger.debug(`Skip ${subscription.symbol} twitter post`);
            return Promise.resolve();
        }
        try {
            await this.postTweet(subscription, quotes, chartLink);
        } catch (e) {
            console.error(e);
        }
        return Promise.resolve();
    }

    private async postTweet(subscription: SubscriptionInterface, quotes: any[], chartLink: string): Promise<any> {
        this.logger.debug(`Post ${subscription.symbol} tweet.`);
        const lineChartId = await this.uploadTwitterMedia(chartLink, 'Line chart:' + subscription.description);
        return T.post('statuses/update', {
            status: TasksService.getSubscriptionStatus(subscription, quotes),
            media_ids: [lineChartId]
        });
    }

    private async postPortfolioTweet(subscription: SubscriptionInterface, quotes: any[], portfolioData: any): Promise<void> {
        this.logger.debug(`Post ${subscription.symbol} tweet.`);
        const lineChartId = await this.uploadTwitterMedia(portfolioData.lineChart, 'Line chart:' + subscription.description);
        const barChartId = await this.uploadTwitterMedia(portfolioData.barChart, 'Bar chart:' + subscription.description);
        return T.post('statuses/update', {
            status: TasksService.getTwitterPortfolioSubscriptionStatus(subscription, quotes, portfolioData),
            media_ids: [lineChartId, barChartId]
        });
    }

    private async uploadTwitterMedia(chartLink, description): Promise<string> {
        const response = await this.httpService.get(chartLink, {responseType: 'arraybuffer'}).toPromise();
        const image = Buffer.from(response.data).toString('base64');
        const result = await T.post('media/upload', {media: image});
        await T.post('media/metadata/create', {
            media_id: result.data.media_id_string,
            alt_text: {text: description}
        });
        return Promise.resolve(result.data.media_id_string);
    }

    private static getSubscriptionStatus(subscription, quotes) {
        let text = subscription.status + '\n';
        text += TasksService.getQuotesStatus(subscription, quotes);
        text += `📆 ${moment.tz(quotes[0].lastRefreshedDate, 'Europe/Minsk').format('HH:mm z')}`;
        return text;
    }

    private static getPortfolioSubscriptionStatus(subscription, quotes, portfolioData) {
        let text = subscription.status + '\n';
        text += `#revenue / #доход $${portfolioData.price} ${parseFloat(portfolioData.change) < 0 ? '📉' : '📈'} (${portfolioData.change} / ${portfolioData.changePercent})\n`;
        text += TasksService.getQuotesStatus(subscription, quotes);
        text += `📆 ${moment.tz(quotes[0].lastRefreshedDate, 'Europe/Minsk').format('HH:mm z')}`;
        return text;
    }

    private static getTwitterPortfolioSubscriptionStatus(subscription, quotes, portfolioData) {
        let text = subscription.status + '\n';
        text += `#revenue / #доход $${portfolioData.price} ${parseFloat(portfolioData.change) < 0 ? '📉' : '📈'} (${portfolioData.change} / ${portfolioData.changePercent})\n`;
        text += `📆 ${moment.tz(quotes[0].lastRefreshedDate, 'Europe/Minsk').format('HH:mm z')}`;
        return text;
    }

    private static getQuotesStatus(subscription, quotes) {
        let text = '';
        if (!quotes.length) {
            return text;
        }
        for (const stock of subscription.stocks) {
            const quote = quotes.find(({symbol}) => symbol === stock.symbol);
            text += `#${stock.label} $${quote.price} ${parseFloat(quote.change) < 0 ? '📉' : '📈'} (${quote.change} / ${quote.changePercent})\n`;
        }
        return text;
    }

    private static async waitFor(ms: number): Promise<any> {
        return new Promise(r => setTimeout(r, ms));
    }
}
