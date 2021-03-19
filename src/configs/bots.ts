import { registerAs } from "@nestjs/config";

const emxliveTelegram = registerAs('emxliveTelegram', () => ({
    name: 'EmxliveBot',
    token: process.env.EMXLIVE_TELEGRAM_BOT_TOKEN
}));

export { emxliveTelegram };
