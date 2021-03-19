import {ProfileType} from "./profile.type";
import {Locale} from "./locale";

export interface Profile {
    id: string,
    type: ProfileType,
    locale: Locale
}