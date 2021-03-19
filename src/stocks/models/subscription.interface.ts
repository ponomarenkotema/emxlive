import {SubscriptionType} from "./subscription.type";

export interface SubscriptionInterface {
    symbol: string,
    type: SubscriptionType,
    name: string,
    cron: string,
    description: string,
    status: string,
    stocks: any[],
    subscribed: boolean
}
