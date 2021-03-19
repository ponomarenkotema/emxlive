import { registerAs } from "@nestjs/config";

const subscriptions = registerAs('subscriptions', () => (
    [
        {
            symbol: 'BRENT/WTI',
            type: 'SPREAD',
            cron: 'EVERY_HOUR',
            stocks: [{symbol: 'CL=F', label: 'WTI'}, {symbol: 'BZ=F', label: 'BRENT'}],
            name: 'Brent-WTI Spread',
            description: 'Crude Oil Prices: WTI, Brent, Brent-WTI Spread',
            status: '🛢️ Цены на #нефть / #oil prices',
        },
        {
            symbol: 'GOLD/BITCOIN',
            type: 'SPREAD',
            cron: 'EVERY_HOUR',
            stocks: [{symbol: 'GC=F', label: 'GOLD', factor: 5}, {symbol: 'BTC-USD', label: 'BITCOIN'}],
            name: 'BITCOIN-5xGOLD Spread',
            description: 'Prices Comparison: GOLD, BITCOIN, BITCOIN-5xGOLD Spread',
            status: 'Сравнение цен на 5x#золото и #биткоин / Comparison of 5x#gold and #bitcoin prices',
        },
        {
            symbol: 'EUR/RUB',
            type: 'SPREAD',
            cron: 'EVERY_HOUR',
            stocks: [{symbol: 'EURUSD=X', label: 'EUR'}, {symbol: 'RUBUSD=X', label: 'RUB', factor: 75}],
            name: 'EUR-70xRUB Spread',
            description: 'Exchange Comparison: EUR, RUB, EUR-75xRUB Spread',
            status: '💱 Сравнение обменных курсов €/$ и 75₽/$ / Exchange rate comparision €/$ and 75₽/$',
        },
        {
            symbol: 'SNP/RTS',
            type: 'SPREAD',
            cron: 'EVERY_HOUR',
            stocks: [{symbol: '^GSPC', label: 'SNP Index'}, {symbol: 'RTSI.ME', label: 'RTS Index', factor: 2.5}],
            name: 'SNP-2.5xRTS Indexes Spread',
            description: 'Indexes Comparison: S&P 500, RTS, S&P-2.5xRTS Spread',
            status: 'Сравнение фондовых индексов S&P 500 и 2.5xRTS / Comparison of S&P 500 and 2.5xRTS indexes',
        },
        {
            symbol: 'RayDalioAllWeather',
            type: 'PORTFOLIO',
            cron: 'EVERY_DAY',
            stocks: [
                {symbol: 'VTI', label: 'Equity, U.S., Large Cap', factor: 0.3},
                {symbol: 'TLT', label: 'Bond, U.S., Long-Term', factor: 0.4},
                {symbol: 'IEI', label: 'Bond, U.S., Intermediate-Term', factor: 0.15},
                {symbol: 'GLD', label: 'Commodity, Gold', factor: 0.075},
                {symbol: 'GSG', label: 'Commodity, Broad Diversified', factor: 0.075},
                ],
            name: 'Ray Dalio All Weather Portfolio',
            description: 'Ray Dalio All Weather Portfolio: 30% VTI + 40% TLT + 15% IEI + 7.5% GLD + 7.5% GSG',
            status: 'Доходность #портфеля Рэя Далио за 3 месяця / Ray Dalio #portfolio returns for 3 month (30% #VTI + 40% #TLT + 15% #IEI + 7.5% #GLD + 7.5% #GSG)',
        }
    ]
));

export { subscriptions };
