import { registerAs } from "@nestjs/config";

const alphavantage = registerAs('alphavantage', () => ({
    token: 'BUQJLP65IWN5FDSN',
    url: 'https://www.alphavantage.co/'
}));

const finnhub = registerAs('finnhub', () => ({
    token: 'bqillg7rh5r89luqomig',
    url: 'https://finnhub.io/api/v1/stock/'
}));


const tiingo = registerAs('tiingo', () => ({
    token: 'b89b33a70897481c37dc3138d8a8e000d8197969',
    url: 'https://api.tiingo.com/'
}));

export { alphavantage };
