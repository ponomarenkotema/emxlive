import {HttpModule, Module} from "@nestjs/common";
import {StocksService} from "./stocks.service";
import {BullModule} from "@nestjs/bull";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {ScheduleModule} from "@nestjs/schedule";
import {TasksService} from "./tasks.service";
import {RedisModule} from "nestjs-redis";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Quote} from "./entity/quote";
import {FavoriteQuote} from "./entity/favorite.quote";
import {QuoteService} from "./quote.service";
import {i18nService} from "../common/i18n.service";

const telegramSubscriptionQueue = BullModule.registerQueueAsync({
    name: 'TELEGRAM_SUBSCRIPTION',
    imports: [ConfigModule],
    useFactory: async (config: ConfigService) => ({
        redis: {
            password: config.get('redis.password'),
            host: config.get('redis.host'),
            port: +config.get('redis.port')
        },
    }),
    inject: [ConfigService],
});

const httpModule = HttpModule.register({
    timeout: 5000,
    maxRedirects: 5,
});


@Module({
    imports: [TypeOrmModule.forFeature([Quote, FavoriteQuote]), ScheduleModule.forRoot(), telegramSubscriptionQueue, httpModule],
    providers: [StocksService, TasksService, QuoteService, i18nService],
    exports: [StocksService, TasksService, QuoteService, i18nService],
})
export class StocksModule {

}
