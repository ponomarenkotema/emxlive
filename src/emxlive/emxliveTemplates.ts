import {SubscriptionInterface} from "../stocks/models/subscription.interface";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Extra = require("telegraf/extra");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Markup = require("telegraf/markup");
import * as moment from 'moment';
import {SearchQuoteInterface} from "../stocks/models/search.quote.interface";
import {QuoteInterface} from "../stocks/models/quote.interface";
import {FavoriteQuote} from "../stocks/entity/favorite.quote";
import {Profile} from "../users/entity/profile";

export class EmxliveTemplates {

    public static confirmRightsMenu(ctx) {
        return Extra.markup(Markup.keyboard([
            ["❌️ " + ctx.i18n.__("No"), "✅ " + ctx.i18n.__("Yes")]
        ]).resize())
    }

    public static mainMenu(ctx) {
        return Extra.markup(Markup.keyboard([
            ["⭐️ " + ctx.i18n.__("Watchlist"), "🔝 " + ctx.i18n.__("Popular")],
            ["⚙ " + ctx.i18n.__("Settings")]
        ]).resize())
    }

    static settingsMenu(profile: Profile, ctx: any) {
        return Extra.HTML().markup((markup) => EmxliveTemplates.settingsMenuInlineKeyboard(profile, ctx));
    }

    static settingsMenuInlineKeyboard(profile: Profile, ctx: any) {
        return Markup.inlineKeyboard([
            [
                Markup.callbackButton(ctx.i18n.__("Timezone: %s", profile.timezone), 'TOGGLE_TIMEZONE'),
            ],
            [
                Markup.callbackButton(ctx.i18n.__("Language: %s", profile.locale), 'TOGGLE_LANGUAGE'),
            ]
        ])
    }

    static settingsTimezoneMenu(profile: Profile, ctx: any) {
        return Extra.HTML().markup((markup) => EmxliveTemplates.settingsTimezoneInlineMenu(profile, ctx));
    }

    static settingsTimezoneInlineMenu(profile: Profile, ctx: any) {
        let actions = [];
        for (let i = -12; i < 12; i++) {
            actions.push(Markup.callbackButton((parseInt(profile.timezone) === i ? "✔️ " : "") +   moment().utcOffset(i).format('HH:mm'), `SET_TIMEZONE ${i}`));
        }
        return Markup.inlineKeyboard(EmxliveTemplates.chunk(actions, 4));
    }

    static subscriptionsList(subscriptions: SubscriptionInterface[], ctx: any) {
        let html = subscriptions.map(subscription => EmxliveTemplates.getSubscriptionPreviewHtml(subscription, ctx)).join("\n\n") + "\n";
        html += `\n <b>${ctx.i18n.__("Select to view details:")} </b>`;
        return html;
    }

    private static getSubscriptionPreviewHtml(subscription: SubscriptionInterface, ctx: any) {
        return `📊 ${ctx.i18n.__(subscription.description)}\n${ctx.i18n.__('Tickers')}: ${subscription.stocks.map(stock => "#" + stock.symbol).join(', ')}`;
    }

    static subscriptionsListMenu(subscriptions: Array<SubscriptionInterface>, ctx: any) {
        return Extra.HTML().markup((markup) => {
            let navigation = [];
            subscriptions.forEach(subscription => {
                navigation.push(markup.callbackButton(ctx.i18n.__(subscription.name), `SHOW_SUBSCRIPTION ${subscription.symbol}`));
            });
            navigation = EmxliveTemplates.chunk(navigation, 2);
            return markup.inlineKeyboard(navigation);
        });
    }

    static searchList(quotes: Array<SearchQuoteInterface>, ctx: any) {
        let html = quotes.map(quote => EmxliveTemplates.getSearchQuotePreviewHtml(quote, ctx)).join("\n\n") + "\n";
        html += `\n <b>${ctx.i18n.__("Select ticker to view details:")} </b>`;
        return html;
    }

    private static getSearchQuotePreviewHtml(quote: SearchQuoteInterface, ctx: any) {
        return `<b>${ctx.i18n.__(quote.shortname || quote.longname)}</b>: ${ctx.i18n.__(quote.quoteType)} (${quote.exchange})`;
    }

    static searchListMenu(quotes: Array<SearchQuoteInterface>, ctx: any) {
        return Extra.HTML().markup((markup) => {
            let navigation = [];
            quotes.forEach(quote => {
                navigation.push(markup.callbackButton(quote.symbol, `GO_TO_QUOTE_DETAILS ${quote.symbol}`));
            });
            navigation = EmxliveTemplates.chunk(navigation, 3);
            return markup.inlineKeyboard(navigation);
        });
    }

    public static chunk(arr, size) {
        return Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
            arr.slice(i * size, i * size + size)
        );
    }

    static quoteDetails(quote: QuoteInterface, favoriteQuote: FavoriteQuote, profile: Profile, ctx: any) {
        let html = `<b>${ctx.i18n.__(quote.shortname || quote.longname)}</b> (${ctx.i18n.__('exchange')}: ${quote.exchange})`;
        html += `\n💱 <b>${quote.price}</b> ${quote.currency || ''}`;
        html += `\n📆 ${moment(quote.lastRefreshedDate).utcOffset(profile ? profile.timezone: 0).format('MM-DD HH:mm')}`;
        html += `\n${parseFloat(quote.change) < 0 ? '📉' : '📈'} ${quote.change} / ${quote.changePercent}`;
        html += `\n<b>${ctx.i18n.__('Open')}</b>: ${quote.open}  <b>${ctx.i18n.__('Low')}</b>: ${quote.low}  <b>${ctx.i18n.__('High')}</b>: ${quote.high} <b>${ctx.i18n.__('Previous close')}</b>: ${quote.previousClose}`;
        if (favoriteQuote) {
            html += `\n🔔 ${ctx.i18n.__('Hourly alert threshold')}: `;
        }
        return html;
    }

    static quoteDetailsInlineMenu(symbol: string, favoriteQuote: FavoriteQuote, ctx: any) {
        let actions = [];
        if (!!favoriteQuote) {
            const alertThreshold = parseFloat(favoriteQuote.alertThreshold.toString());
            actions.push(Markup.callbackButton((alertThreshold === 101.00 ? "✔️ " : "") + "🔕", `SET_ALERT_THRESHOLD_OFF ${symbol}`));
            actions.push(Markup.callbackButton((alertThreshold === 0 ? "✔️ " : "") + "1 hour", `SET_ALERT_THRESHOLD_0.01 ${symbol}`));
            actions.push(Markup.callbackButton((alertThreshold === 0.25 ? "✔️ " : "") + "0.25%", `SET_ALERT_THRESHOLD_0.25 ${symbol}`));
            actions.push(Markup.callbackButton((alertThreshold === 0.50 ? "✔️ " : "") + "0.5%", `SET_ALERT_THRESHOLD_0.5 ${symbol}`));
            actions.push(Markup.callbackButton((alertThreshold === 1.00 ? "✔️ " : "") + "1%", `SET_ALERT_THRESHOLD_1 ${symbol}`));
            actions.push(Markup.callbackButton((alertThreshold === 5.00 ? "✔️ " : "") + "5%", `SET_ALERT_THRESHOLD_5 ${symbol}`));
            actions = EmxliveTemplates.chunk(actions, 3);
        }
        actions.push([
            !!favoriteQuote ? Markup.callbackButton("⭕ " + ctx.i18n.__("Remove from favorites"), `REMOVE_QUOTE_FROM_FAVORITE ${symbol}`)
                : Markup.callbackButton("⭐️ " + ctx.i18n.__("Add to favorites"), `ADD_QUOTE_TO_FAVORITE ${symbol}`),
        ]);
        actions.push([
            Markup.switchToChatButton("💬 " + ctx.i18n.__("Share"), 'ticker#' + symbol)
        ]);
        return Markup.inlineKeyboard(actions);
    }

    public static quoteAlert(quote: QuoteInterface) {
        let html = `Alert: <b>${quote.shortname || quote.longname}</b> (${'exchange'}: ${quote.exchange})`;
        html += `\n📆 ${moment(quote.lastRefreshedDate).format('MM-DD HH:mm')} <b>${quote.price}</b> ${quote.currency}`;
        html += `\n${parseFloat(quote.change) < 0 ? '📉' : '📈'} (${quote.change} / ${quote.changePercent})`;
        html += `\n${'Previous close'}: ${quote.previousClose}`;
        return html;
    }

    static quoteInlineDetailsResult(chartLink: string, quote: QuoteInterface, ctx: any) {
        return {
            type: 'photo',
            id: 'ticker#' + quote.symbol,
            title: quote.shortname,
            description: quote.longname || quote.shortname,
            caption: EmxliveTemplates.quoteDetails(quote, null, null, ctx),
            photo_url: chartLink,
            thumb_url: chartLink,
            parse_mode: 'HTML',
            reply_markup: EmxliveTemplates.getQuoteInlineMenuKeyboard(quote, ctx)
        }
    }

    static getQuoteInlineMenuKeyboard(quote: QuoteInterface, ctx: any) {
        return Markup.inlineKeyboard([
            [
                Markup.urlButton("🤖 " + ctx.i18n.__("Get more in bot"), `t.me/StockMarketDataBot`),
            ],
            [
                Markup.switchToChatButton("💬 " + ctx.i18n.__("Share"), 'ticker#' + quote.symbol)
            ]
        ]);
    }

    static favoritesList(favorites: FavoriteQuote[], ctx: any) {
        let html = favorites.map(favoriteQuote =>
            EmxliveTemplates.getFavoriteQuotePreviewHtml(favoriteQuote.quote.meta, ctx) +
            `\n ${ctx.i18n.__('Alarm threshold')}: ${favoriteQuote.alertThreshold < 101 ? favoriteQuote.alertThreshold + "%" : "🔕"}`
        ).join("\n\n") + "\n";
        html += `\n <b>${ctx.i18n.__("Select ticker to view details:")} </b>`;
        return html;
    }

    private static getFavoriteQuotePreviewHtml(quote: QuoteInterface, ctx: any) {
        return `<b>${ctx.i18n.__(quote.shortname || quote.longname)}</b>: ${ctx.i18n.__(quote.quoteType)} (${quote.exchange})`;
    }

    static favoritesListMenu(favorites: FavoriteQuote[], page: number, count: number, ctx: any) {
        return Extra.HTML().markup((markup) => {
            let navigation = [];
            favorites.forEach(favorite => {
                navigation.push(markup.callbackButton(favorite.quote.symbol, `GO_TO_QUOTE_DETAILS ${favorite.quote.symbol}`));
            });
            navigation = EmxliveTemplates.chunk(navigation, 3);
            let pagination = [];
            if (page > 1) {
                pagination.push(
                    markup.callbackButton("⬅ " + ctx.i18n.__("Back"), `GO_TO_FAVORITES_PAGE ${page - 1}`)
                );
            }
            if (page * 6 < count) {
                pagination.push(
                    markup.callbackButton(ctx.i18n.__("Next (%d-%d of %d)", page * 6 + 1, page * 6 + 6 < count ? page * 6 + 6 : count, count) + " ➡", `GO_TO_FAVORITES_PAGE ${page + 1}`)
                );
            }
            if (pagination.length > 0) {
                navigation.push(pagination);
            }
            return markup.inlineKeyboard(navigation);
        });
    }

    static qetSubscriptionDetails(subscription: SubscriptionInterface, quotes: any[], ctx: any) {
        let html = ctx.i18n.__(subscription.description) + "\n";
        for (const stock of subscription.stocks) {
            const quote = quotes.find(({symbol}) => symbol === stock.symbol);
            html += `${ctx.i18n.__(stock.label)} (#${stock.symbol}) <b>$${quote.price}</b> ${parseFloat(quote.change) < 0 ? '📉' : '📈'} (${quote.change} / ${quote.changePercent})\n\n`;
        }
        return html;
    }

    static quoteSubscriptionDetailsInlineMenu(subscription: SubscriptionInterface, quotes: any[], ctx: any) {
        let goToQuoteActions = [];
        for (const quote of quotes) {
            goToQuoteActions.push(Markup.callbackButton(quote.symbol, `GO_TO_QUOTE_DETAILS ${quote.symbol}`));
        }
        const actions = EmxliveTemplates.chunk(goToQuoteActions, 3);
        actions.push([Markup.switchToChatButton("💬 " + ctx.i18n.__("Share"), 'subscription#' + subscription.symbol)]);
        return Markup.inlineKeyboard(actions);
    }

    static quoteInlineSubscriptionResult(subscription: SubscriptionInterface, chartLink2: string, quotes: any[], ctx: any) {
        return {
            type: 'photo',
            id: 'ticker#' + subscription.symbol,
            title: subscription.description,
            description: subscription.description,
            caption: EmxliveTemplates.qetSubscriptionDetails(subscription, quotes, ctx),
            photo_url: chartLink2,
            thumb_url: chartLink2,
            parse_mode: 'HTML',
            reply_markup: EmxliveTemplates.getQuoteSubscriptionMenuKeyboard(subscription, ctx)
        }
    }

    static getQuoteSubscriptionMenuKeyboard(subscription: SubscriptionInterface, ctx: any) {
        return Markup.inlineKeyboard([
            [
                Markup.urlButton("🤖 " + ctx.i18n.__("Get more in bot"), `t.me/StockMarketDataBot`),
            ],
            [
                Markup.switchToChatButton("💬 " + ctx.i18n.__("Share"), 'subscription#' + subscription.symbol)
            ]
        ]);
    }
}
