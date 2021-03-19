import {Controller, Get, Post} from '@nestjs/common';
import {AppService} from './app.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get()
    getHello() {
        return this.appService.getHello();
    }

    @Get('/charts')
    getCharts() {
        return this.appService.getCharts();
    }

    @Get('/portfolios')
    getCgetPortfoliosharts() {
        return this.appService.getPortfolios();
    }

    @Get('/cookiefy')
    getCookiefy() {
        return this.appService.getCookiefy();
    }

}
