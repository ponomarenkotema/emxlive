import Telegraf from 'telegraf';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {i18nService} from "../common/i18n.service";
import {EmxliveTemplates} from "./emxliveTemplates";
import {StocksService} from "../stocks/stocks.service";
import {ProfileType} from "../stocks/models/profile.type";
import {Locale} from "../stocks/models/locale";
import {Profile} from "../stocks/models/profile.interface";
import {QuoteService} from "../stocks/quote.service";
import {Network} from "../users/entity/profile";
import {ProfilesService} from "../users/profiles.service";
import {SubscriptionInterface} from "../stocks/models/subscription.interface";

@Injectable()
export class EmxliveTelegramService {
    private readonly stocksService: StocksService;
    private readonly quoteService: QuoteService;
    private readonly profilesService: ProfilesService;
    private readonly logger = new Logger(EmxliveTelegramService.name);
    private bot: Telegraf<any>;
    private i18n: i18nService;
    private readonly subscriptions: Array<SubscriptionInterface>;

    constructor(config: ConfigService, i18n: i18nService, stocksService: StocksService, quoteService: QuoteService, profilesService: ProfilesService) {
        const botToken: string = config.get('emxliveTelegram.token');
        this.subscriptions = config.get('subscriptions');
        this.stocksService = stocksService;
        this.quoteService = quoteService;
        this.profilesService = profilesService;
        this.bot = new Telegraf(botToken);
        this.bot.catch((err) => {
            this.logger.error(err.message);
            console.log(err);
        });
        this.bot.use(async (ctx, next) => {
            ctx.i18n = i18n;
            let profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
            ctx.i18n.setLocale(profile ? profile.locale.toString() : ctx.from['language_code']);
            this.logger.debug(`Message form ${JSON.stringify(ctx.from)}`);
            return next();
        });
        this.bot.start(EmxliveTelegramService.onStarted);
        this.bot.help(EmxliveTelegramService.onHelp);
        this.bot.hears(/✅️ (.+)/i, ctx => {
            return this.onApprove(ctx);
        });
        this.bot.hears(/⭐️ (.+)/i, ctx => {
            return this.onShowFavoriteList(1, ctx);
        });
        this.bot.hears(/🔝 (.+)/i, ctx => {
            return this.onShowSubscriptionsList(ctx);
        });
        this.bot.hears(/⚙ (.+)/i, ctx => {
            return this.onShowSettings(ctx);
        });
        this.bot.action(/GO_TO_FAVORITES_PAGE (.+)/i, async (ctx) => {
            const page = parseInt(ctx.match[1]);
            await ctx.answerCbQuery("loading...");
            return this.onShowFavoriteList(page, ctx);
        });
        this.bot.action(/TOGGLE_LANGUAGE/i, async (ctx) => {
            await ctx.answerCbQuery("loading...");
            return this.onToggleLanguage(ctx);
        }); 
        this.bot.action(/TOGGLE_TIMEZONE/i, async (ctx) => {
            await ctx.answerCbQuery("loading...");
            return this.onToggleTimeZone(ctx);
        });
        this.bot.action(/SHOW_SUBSCRIPTION (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery("loading...");
            return this.onShowSubscription(symbol, ctx);
        });
        this.bot.action(/SET_TIMEZONE (.+)/i, async (ctx) => {
            const timezone = parseInt(ctx.match[1]);
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.onSaveTimezone(timezone, ctx);
        });
        this.bot.action(/GO_TO_QUOTE_DETAILS (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('loading...'));
            return this.onShowQuote(symbol, ctx);
        });
        this.bot.action(/ADD_QUOTE_TO_FAVORITE (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.onAddFavorite(symbol, ctx);
        });
        this.bot.action(/REMOVE_QUOTE_FROM_FAVORITE (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.onRemoveFavorite(symbol, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_OFF (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 101, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_0.25 (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 0.25, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_0.01 (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 0, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_0.5 (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 0.5, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_1 (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 1, ctx);
        });
        this.bot.action(/SET_ALERT_THRESHOLD_5 (.+)/i, async (ctx) => {
            const symbol = ctx.match[1];
            await ctx.answerCbQuery(ctx.i18n.__('performing your request...'));
            return this.setFavoriteQuoteAlertThreshold(symbol, 5, ctx);
        });
        this.bot.on('text', async (ctx) => {
            return this.onSearchInput(ctx);
        });
        this.bot.on('inline_query', async (ctx) => {
            return this.onInlineQuery(ctx);
        });
    }

    public async launch(): Promise<void> {
        await this.bot.launch();
        const botInfo = await this.bot.telegram.getMe();
        this.logger.debug("Server has initialized bot nickname. Nick: " + botInfo.username);
        return Promise.resolve();
    }

    private static onStarted(ctx): void {
        return ctx.replyWithHTML(
            ctx.i18n.__(`Welcome to EMX Live.`) +
            '\n\n' +
            ctx.i18n.__(`This Service is absolutely FREE and as a one-time registration process, please confirm the following:`) +
            '\n\n' +
            ctx.i18n.__('1) You have added this number to your contacts.') +
            '\n\n' +
            ctx.i18n.__('2) You have understood the T&C http://emxlive.com/terms-and-condition and agree to receive notifications from us.'),
            EmxliveTemplates.mainMenu(ctx));
    }

    private static onHelp(ctx): void {
        return ctx.replyWithHTML(ctx.i18n.__(`I am @EmxliveBot bot, your personal assistant in stock markets.`) + EmxliveTelegramService.getHelpText(ctx));
    }

    private static getHelpText(ctx) {
        return '\n\n' +
            ctx.i18n.__(`Send me the name of any public company, futures contract or exchange (for ex: APPLE INC, Brent Crude Oil, RUB/USD) or directly ticker (for ex: AAPL, BZ=F, RUBUSD=X) and I will send you fresh stock chart.`) +
            '\n\n' +
            ctx.i18n.__(`Use ⭐ button to add tickers to your favorites which is allow you to enable notifications in the ticker settings.`) +
            '\n\n' +
            ctx.i18n.__(`Feel free to get in touch with my creator https://t.me/emxlive to share your suggestions and wishes about my functionality.`);
    }

    private async onShowFavoriteList(page: number, ctx: any): Promise<void> {
        const profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
        if (!profile || !profile.favorites.length) {
            return ctx.replyWithHTML(ctx.i18n.__(`Your do not have favorite tickers yet. Send me name of public company or futures or currency and will send you price information.`));
        }
        const count = profile.favorites.length;
        const favorites = profile.favorites.slice((page - 1) * 6, page * 6);
        return ctx.replyWithHTML(EmxliveTemplates.favoritesList(favorites, ctx), EmxliveTemplates.favoritesListMenu(favorites, page, count, ctx));
    }

    private async onShowSubscriptionsList(ctx): Promise<void> {
        return ctx.replyWithHTML(EmxliveTemplates.subscriptionsList(this.subscriptions, ctx), EmxliveTemplates.subscriptionsListMenu(this.subscriptions, ctx));
    }

    private async onShowSubscription(id, ctx) {
        const subscription = this.subscriptions.find(({symbol}) => symbol === id);
        const chartLink = await this.stocksService.getSubscriptionChartLink(subscription.symbol);
        let quotes = [];
        for (const stock of subscription.stocks) {
            quotes.push(await this.stocksService.getQuote(stock.symbol));
        }
        return ctx.replyWithPhoto(chartLink, {
            caption: EmxliveTemplates.qetSubscriptionDetails(subscription, quotes, ctx),
            parse_mode: 'HTML',
            reply_markup: EmxliveTemplates.quoteSubscriptionDetailsInlineMenu(subscription, quotes, ctx)
        });
    }

    private async onAddFavorite(symbol, ctx) {
        await this.profilesService.saveProfile(Network.TELEGRAM, ctx.from.id, ctx.from);
        const insertResult = await this.quoteService.addQuoteToFavorites(Network.TELEGRAM, ctx.from.id, symbol);
        return ctx.editMessageReplyMarkup(EmxliveTemplates.quoteDetailsInlineMenu(symbol, insertResult.raw[0], ctx));
    }

    private static mapToProfile(ctx): Profile {
        return {
            id: ctx.from.id,
            type: ProfileType.TELEGRAM,
            locale: ctx.from['language_code'] === 'en' ? Locale.en : Locale.ru
        }
    }

    private async onSearchInput(ctx: any) {
        const quotes = await this.stocksService.search(ctx.message.text);
        if (!quotes.length) {
            return ctx.replyWithHTML(ctx.i18n.__(`I can not find any stock information by you request.`));
        }
        return ctx.replyWithHTML(EmxliveTemplates.searchList(quotes, ctx), EmxliveTemplates.searchListMenu(quotes, ctx));
    }

    private async onInlineQuery(ctx: any) {
        const matches = ctx.inlineQuery.query.match(/ticker#(.*)/);
        if (matches && matches.length > 1) {
            const symbol = matches[1].trim();
            const quote = await this.stocksService.getQuote(symbol);
            const chartLink = await this.stocksService.getQuoteChartLink(symbol);
            return ctx.answerInlineQuery([EmxliveTemplates.quoteInlineDetailsResult(chartLink, quote, ctx)]);
        }

        const matches2 = ctx.inlineQuery.query.match(/subscription#(.*)/);
        if (matches2 && matches2.length > 1) {
            const id = matches2[1].trim();
            const subscription = this.subscriptions.find(({symbol}) => symbol === id);
            const chartLink2 = await this.stocksService.getSubscriptionChartLink(subscription.symbol);
            let quotes = [];
            for (const stock of subscription.stocks) {
                quotes.push(await this.stocksService.getQuote(stock.symbol));
            }
            return ctx.answerInlineQuery([EmxliveTemplates.quoteInlineSubscriptionResult(subscription, chartLink2, quotes, ctx)]);
        }
    }

    private async onShowQuote(symbol: any, ctx: any) {
        const profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
        const quote = await this.stocksService.getQuote(symbol);
        const chartLink = await this.stocksService.getQuoteChartLink(symbol);
        const favoriteQuote = profile ? profile.favorites.find((favorite) => favorite.quoteSymbol === symbol) : null;
        return ctx.replyWithPhoto(chartLink, {
            caption: EmxliveTemplates.quoteDetails(quote, favoriteQuote, profile, ctx),
            parse_mode: 'HTML',
            reply_markup: EmxliveTemplates.quoteDetailsInlineMenu(symbol, favoriteQuote, ctx)
        });
    }

    private async onRemoveFavorite(symbol: any, ctx: any) {
        await this.quoteService.removeQuoteFromFavorites(Network.TELEGRAM, ctx.from.id, symbol);
        return ctx.editMessageReplyMarkup(EmxliveTemplates.quoteDetailsInlineMenu(symbol, null, ctx));
    }

    private async setFavoriteQuoteAlertThreshold(symbol: any, threshold: number, ctx: any) {
        const favoriteQuote = await this.quoteService.setFavoriteQuoteAlertThreshold(Network.TELEGRAM, ctx.from.id, symbol, threshold);
        return ctx.editMessageReplyMarkup(EmxliveTemplates.quoteDetailsInlineMenu(symbol, favoriteQuote, ctx));
    }

    private async onShowSettings(ctx: any) {
        let profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
        if (!profile) {
            profile = await this.profilesService.saveEmxliveProfile(Network.TELEGRAM, ctx.from.id, ctx.from);
        }
        return ctx.replyWithHTML(ctx.i18n.__(`You timezone and bot language settings:`), EmxliveTemplates.settingsMenu(profile, ctx));
    }

    private async onApprove(ctx: any) {
        let profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
        if (!profile) {
            profile = await this.profilesService.saveEmxliveProfile(Network.TELEGRAM, ctx.from.id, ctx.from);
        }
        return ctx.replyWithHTML(ctx.i18n.__(`Now we are ready to start:`) + EmxliveTelegramService.getHelpText(ctx), EmxliveTemplates.mainMenu(ctx));
    }

    private async onToggleLanguage(ctx: any) {
        const profile = await this.profilesService.toggleLanguage(Network.TELEGRAM, ctx.from.id);
        ctx.i18n.setLocale(profile ? profile.locale.toString() : ctx.from['language_code']);
        await ctx.editMessageReplyMarkup(EmxliveTemplates.settingsMenuInlineKeyboard(profile, ctx));
        return ctx.replyWithHTML(profile.locale === Locale.en ? 'I will speak English now' : 'Теперь я буду говорить на Русском', EmxliveTemplates.mainMenu(ctx));
    }

    private async onToggleTimeZone(ctx: any) {
        let profile = await this.profilesService.getProfile(Network.TELEGRAM, ctx.from.id);
        return ctx.replyWithHTML(ctx.i18n.__(`What is your current time?`), EmxliveTemplates.settingsTimezoneMenu(profile, ctx));
    }

    private async onSaveTimezone(timezone: number, ctx: any) {
        const profile = await this.profilesService.saveTimezone(Network.TELEGRAM, ctx.from.id, timezone);
        await ctx.editMessageReplyMarkup(EmxliveTemplates.settingsTimezoneInlineMenu(profile, ctx));
        return ctx.replyWithHTML(ctx.i18n.__(`Now your timezone is %s`, profile.timezone));
    }
}
