import * as path from "path";
const i18n = require('i18n');

export class i18nService {
    constructor() {
        i18n.configure({
            locales: ['ru', 'en'],
            extension: '.json',
            directory: path.join(__dirname, './../../locales')
        });
    }

    public __(key: string, ...params): string {
        return i18n.__(key, ...params);
    }

    public setLocale(locale: string): string {
        return i18n.setLocale(locale);
    }
}
