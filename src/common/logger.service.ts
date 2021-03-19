import { Logger } from '@nestjs/common';

const shouldOutputAsJson = () => {
    const env = (process.env.NODE_ENV || 'test').toLowerCase();
    if (env === 'production' || env === 'qa') {
        return true;
    }
    return false;
};

const logAsJson = (type:string, message: string, context?: string, trace?: string) => {
    const log = {
        type,
        message,
        context,
        trace
    };
    return console.log(JSON.stringify(log));
};


export class AppLogger extends Logger {

    log(message: string, context?: string) {
        if (shouldOutputAsJson()) {
            return logAsJson('LOG', message, context);
        }
        return super.log(message, context);
    }

    error(message: string, trace: string, context?: string) {
        if (shouldOutputAsJson()) {
            return logAsJson('ERROR', message, context, trace);
        }
        return super.error(message, context);
    }

    warn(message: string, context?: string) {
        if (shouldOutputAsJson()) {
            return logAsJson('WARN', message, context);
        }
        return super.warn(message, context);
    }

    debug(message: string, context?: string) {
        if (shouldOutputAsJson()) {
            return logAsJson('DEBUG', message, context);
        }
        return super.debug(message, context);
    }

    verbose(message: string, context?: string) {
        if (shouldOutputAsJson()) {
            return logAsJson('VERBOSE', message, context);
        }
        return super.verbose(message, context);
    }
}