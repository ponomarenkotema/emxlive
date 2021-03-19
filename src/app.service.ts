import {HttpService, Injectable} from '@nestjs/common';
import {StocksService} from "./stocks/stocks.service";

@Injectable()
export class AppService {
    private readonly stocksService: StocksService;
    private readonly httpService: HttpService;

    constructor(stocksService: StocksService, httpService: HttpService) {
        this.stocksService = stocksService;
        this.httpService = httpService;
    }

    async getCharts() {
        return `
<img src='${await this.stocksService.getSubscriptionChartLink('BRENT/WTI')}' width="500"/> 
<img src='${await this.stocksService.getSubscriptionChartLink('GOLD/BITCOIN')}' width="500"/>
<img src='${await this.stocksService.getSubscriptionChartLink('EUR/RUB')}' width="500"/>
<img src='${await this.stocksService.getSubscriptionChartLink('SNP/RTS')}' width="500"/>
`;
    }

    async getPortfolios() {
        let data = await this.stocksService.getPortfolioSubscriptionData('RayDalioAllWeather', null);
        return `
<img src='${data.barChart}' width="800"/> 
<img src='${data.lineChart}' width="800"/> 
`;
    }

    getHello() {
        return 'Pong';
    }

    getCookiefy() {
        return `<!doctype html>
<html lang="en">
<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Cookiefy test page</title>

</head>
<body>

<!-- Modal -->
<script src="bundle.js?v=3"></script>
</body>
</html>`;
    }
}
