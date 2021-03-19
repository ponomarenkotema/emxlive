import {HttpModule, Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {emxliveTelegram} from './configs/bots';
import {subscriptions} from './configs/subscriptions';
import {redis, postgres} from './configs/datasources';
import {alphavantage} from './configs/stock-market-api';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {StocksModule} from "./stocks/stocks.module";
import { UsersModule } from './users/users.module';
import {Profile} from "./users/entity/profile";
import {Chat} from "./users/entity/chat";
import {Quote} from "./stocks/entity/quote";
import {FavoriteQuote} from "./stocks/entity/favorite.quote";
import {ServeStaticModule} from "@nestjs/serve-static";
import { join } from 'path';
import {EmxliveModule} from "./emxlive/emxlive.module";


const configModule = ConfigModule.forRoot({
    load: [emxliveTelegram, redis, postgres, subscriptions, alphavantage],
    isGlobal: true
});

const httpModule = HttpModule.register({
    timeout: 5000,
    maxRedirects: 5,
});

const typeOrmModule = TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => {
        return {
            type: 'postgres',
            host: configService.get<string>('postgres.host'),
            port: configService.get<number>('postgres.port'),
            username: configService.get<string>('postgres.user'),
            password: configService.get<string>('postgres.password'),
            database: configService.get<string>('postgres.database'),
            entities: [Profile, Chat, Quote, FavoriteQuote],
            synchronize: true,
            dropSchema: process.env.NODE_ENV === 'test',
            ssl: true,
            extra: {
                ssl: {
                    rejectUnauthorized: false,
                }
            }
        };
    },
    inject: [ConfigService],
});

@Module({
    imports: [
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'public'),
        }),
        configModule,
        StocksModule,
        httpModule,
        typeOrmModule,
        UsersModule,
        EmxliveModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}
