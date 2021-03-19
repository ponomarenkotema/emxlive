import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {AppLogger} from './common/logger.service';
process.env.TZ = 'Europe/London';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useLogger(new AppLogger());
    await app.listen(process.env.PORT || 3000);
}

bootstrap();
