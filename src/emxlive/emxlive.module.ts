import {Module} from '@nestjs/common';
import {EmxliveTelegramService} from './emxlive-telegram.service';
import {i18nService} from '../common/i18n.service';
import {StocksModule} from "../stocks/stocks.module";
import {UsersModule} from "../users/users.module";

@Module({
    imports: [StocksModule, UsersModule],
    providers: [EmxliveTelegramService, i18nService],
    exports: [EmxliveTelegramService, i18nService],
})
export class EmxliveModule {
    constructor(telegramService: EmxliveTelegramService) {
        telegramService.launch();
    }
}
