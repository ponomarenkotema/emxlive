import {HttpService, Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import {SubscriptionInterface} from "./models/subscription.interface";
import {Profile} from "./models/profile.interface";
import {SearchQuoteInterface} from "./models/search.quote.interface";
import {QuoteInterface} from "./models/quote.interface";

import * as moment from 'moment-timezone';

const Decimal = require('decimal.js');

@Injectable()
export class StocksService {
    private readonly httpService: HttpService;
    private readonly subscriptions: Array<SubscriptionInterface>;

    constructor(config: ConfigService, httpService: HttpService) {
        this.httpService = httpService;
        this.subscriptions = config.get('subscriptions');
    }

    public async search(text: string): Promise<Array<SearchQuoteInterface>> {
        const result = await this.httpService.get(`https://query2.finance.yahoo.com/v1/finance/search?q=${text}&quotesCount=6`).toPromise();
        return Promise.resolve(result.data['quotes']);
    }

    public async getQuote(symbol: string): Promise<QuoteInterface> {
        const result = await this.httpService.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?formatted=true&lang=en-US&region=US&modules=price`).toPromise();
        return Promise.resolve(StocksService.mapQuotePriceSummary(result.data.quoteSummary.result[0].price));
    }

    public async getQuoteChart(symbol: string, interval: string, range: string): Promise<any> {
        interval = interval || '1h';
        range = range || '3d';
        const result = await this.httpService.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?includePrePost=false&interval=${interval}&range=${range}&.tsrc=finance`).toPromise();
        return Promise.resolve(result.data.chart.result[0]);
    }

    public async getPortfolioSubscriptionData(s: string, sc: number): Promise<any> {
        const capital = new Decimal(sc || 10000);
        let subscription = this.subscriptions.find(({symbol}) => symbol === s);
        let values = [];
        let days = [];
        const barSets = [];
        const lineSets = [];

        function* color() {
            yield 'rgb(0, 63, 92)';
            yield 'rgb(255, 166, 0)';
            yield 'rgb(88, 80, 141)';
            yield 'rgb(188, 80, 144)';
            yield 'rgb(255, 99, 97)';
        }

        const gen = color();
        for (const stock of subscription.stocks) {
            const chart = await this.getQuoteChart(stock.symbol, '1d', '3mo');
            if (!days.length) {
                days = (chart.timestamp).map(d => moment.tz(d * 1000, 'Europe/Minsk').format('DD HH:mm'));
            }
            const startPrice = chart.indicators.quote[0].close[0];
            const amount = capital.times(stock.factor).dividedBy(startPrice);
            const returns = chart.indicators.quote[0].close.map(v => amount.times(v).toNumber());
            barSets.push({
                label: stock.factor * 100 + '% ' + stock.symbol,
                data: returns,
                backgroundColor: gen.next().value
            });
            if (!values.length) {
                values = returns;
            } else {
                values = values.map(function (num, idx) {
                    return (new Decimal(num)).plus(returns[idx]).toNumber().toFixed(2);
                });
            }
        }
        lineSets.push({
            label: subscription.stocks.map(s => s.factor * 100 + '% ' + s.symbol).join(' + '),
            data: values,
            fill: false,
            pointRadius: 0,
            spanGaps: false,
            lineTension: 0,
            borderWidth: 2,
            backgroundColor: 'rgb(88, 80, 141)',
            borderColor: 'rgb(188, 80, 144)'
        });
        const ret = new Decimal(values[values.length - 1]);
        return {
            barChart: 'https://quickchart.io/chart?' + encodeURI(`width=600&height=335&c=${JSON.stringify(
                StocksService.defaultBarChartConfig(days, barSets, `${capital.toNumber()}$ ${subscription.name}`)
            )}`),
            lineChart: 'https://quickchart.io/chart?' + encodeURI(`width=600&height=335&c=${JSON.stringify(  
                StocksService.defaultChartConfig(days, lineSets, `${capital.toNumber()}$ ${subscription.name}`, Math.min(...values), Math.max(...values))
            )}`),
            price: ret.toNumber().toFixed(2),
            change: ret.minus(capital).toNumber().toFixed(2),
            changePercent: ret.dividedBy(capital).minus(1).toNumber().toFixed(2) + '%'
        };
    }

    public async getSubscriptionChartLink(s: string): Promise<string> {
        let subscription = this.subscriptions.find(({symbol}) => symbol === s);
        let charts = [];
        for (const stock of subscription.stocks) {
            charts.push(await this.getQuoteChart(stock.symbol, null, null));
        }
        return Promise.resolve(StocksService.getSubscriptionChartLink(subscription, charts));
    }

    public async getQuoteChartLink(symbol: string): Promise<string> {
        const chart = await this.getQuoteChart(symbol, null, null);
        return Promise.resolve(StocksService.getChartLink(chart));
    }

    private static getChartLink(chart) {
        const days = (chart.timestamp).map(d => moment.tz(d * 1000, 'Europe/Minsk').format('DD HH:mm'));
        const values = chart.indicators.quote[0].close;
        for (let i = 0; i < values.length; i++) {
            if (!values[i] && values[i - 1]) {
                values[i] = values[i - 1];
            }
            values[i] =  parseFloat(values[i]).toFixed(2);
        }
        const sets = [];
        sets.push({
            label: chart.meta.symbol,
            data: values,
            fill: false,
            pointRadius: 0,
            spanGaps: false,
            lineTension: 0,
            borderWidth: 2,
            backgroundColor: 'rgb(88, 80, 141)',
            borderColor: 'rgb(88, 80, 141)'
        });
        sets.push({
            label: 'Previous close',
            data: values.map(v => chart.meta.previousClose),
            fill: true,
            pointRadius: 0,
            borderDash: [5, 5],
            borderWidth: 1,
            lineTension: 0,
            backgroundColor: 'rgba(255, 255, 255, 0)',
            borderColor: 'rgb(88, 80, 141)'
        });
        return 'https://quickchart.io/chart?' + encodeURI(`width=600&height=335&c=${JSON.stringify(StocksService.defaultChartConfig(days, sets, chart.meta.symbol, Math.min(...values), Math.max(...values)))}`);
    }

    private static getSubscriptionChartLink(subscription: SubscriptionInterface, charts: Array<any>) {
        function* color() {
            yield 'rgb(0, 63, 92)';
            yield 'rgb(255, 166, 0)';
            yield 'rgb(88, 80, 141)';
            yield 'rgb(188, 80, 144)';
            yield 'rgb(255, 99, 97)';
        }

        const gen = color();
        const days = (charts[0].timestamp.length > charts[1].timestamp.length ? charts[1].timestamp : charts[0].timestamp).map(d => moment.tz(d * 1000, 'Europe/Minsk').format('DD HH:mm'));
        const sets = [];
        const suggestedMax = [];
        const suggestedMin = [];
        for (const chart of charts) {
            const color = gen.next().value;
            const stock = subscription.stocks.find(({symbol}) => symbol === chart.meta.symbol);
            let values = chart.indicators.quote[0].close;
            const factor = stock.factor || 1;
            for (let i = 0; i < values.length; i++) {
                if (!values[i] && values[i - 1]) {
                    values[i] = values[i - 1];
                }
            }
            values = values.map(v => (v * factor).toFixed(2));
            suggestedMax.push(Math.max(...values));
            suggestedMin.push(Math.min(...values));
            sets.push({
                label: stock.label,
                data: values,
                fill: false,
                pointRadius: 0,
                spanGaps: false,
                lineTension: 0,
                borderWidth: 2,
                backgroundColor: color,
                borderColor: color
            });
            let prevCloseValue = chart.meta.previousClose * factor;
            sets.push({
                label: 'Previous close',
                data: values.map(v => prevCloseValue),
                fill: true,
                pointRadius: 0,
                borderDash: [5, 5],
                borderWidth: 1,
                lineTension: 0,
                backgroundColor: 'rgba(255, 255, 255, 0)',
                borderColor: color
            })
        }
        return 'https://quickchart.io/chart?' + encodeURI(`width=600&height=335&c=${JSON.stringify(StocksService.defaultChartConfig(days, sets, subscription.name, Math.min(...suggestedMin), Math.max(...suggestedMax)))}`);
    }

    private static mapQuotePriceSummary(data: any): QuoteInterface {
        return {
            exchange: data.exchange,
            shortname: data.shortName,
            longname: data.longName,
            quoteType: data.quoteType,
            symbol: data.symbol,
            currency: data.currency,
            lastRefreshedDate: data.regularMarketTime * 1000,
            previousClose: data.regularMarketPreviousClose.fmt,
            open: data.regularMarketOpen.fmt,
            high: data.regularMarketDayHigh.fmt,
            low: data.regularMarketDayLow.fmt,
            price: data.regularMarketPrice.fmt,
            change: data.regularMarketChange.fmt,
            changePercent: data.regularMarketChangePercent.fmt
        }
    }

    private static defaultChartConfig(days, sets, name, min, max) {
        return {
            type: 'line',
            data: {
                labels: days,
                datasets: sets
            },
            options: {
                title: {
                    display: true,
                    text: name,
                    fontSize: 10,
                    padding: 5
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 5,
                        fontSize: 8,
                        boxWidth: 30
                    },
                },
                scales: {
                    xAxes: [{
                        distribution: 'series',
                        offset: true,
                        ticks: {
                            major: {
                                enabled: true,
                                fontStyle: 'bold'
                            }
                        },
                    }],
                    yAxes: [{
                        gridLines: {
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Closing price ($)'
                        },
                        ticks: {
                            suggestedMin: min,
                            suggestedMax: max
                        }
                    }]
                }
            }
        };
    }

    private static defaultBarChartConfig(days, sets, name) {
        return {
            type: 'bar',
            data: {
                labels: days,
                datasets: sets
            },
            options: {
                title: {
                    display: true,
                    text: name,
                    fontSize: 10,
                    padding: 5
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 5,
                        fontSize: 8,
                        boxWidth: 30
                    },
                },
                scales: {
                    xAxes: [{stacked: true}],
                    yAxes: [{
                        stacked: true,
                        gridLines: {
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Closing price ($)'
                        }
                    }],
                }
            }
        };
    }
}
