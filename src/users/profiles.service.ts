import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {InsertResult, Repository, UpdateResult} from "typeorm";
import {Locale, Network, Profile} from "./entity/profile";
import {Chat} from "./entity/chat";
import moment = require("moment");

@Injectable()
export class ProfilesService {
    constructor(
        @InjectRepository(Profile)
        private readonly profilesRepository: Repository<Profile>,
        @InjectRepository(Chat)
        private readonly chatRepository: Repository<Chat>
    ) {
    }

    async getProfile(network: Network, id: string): Promise<Profile> {
        return this.profilesRepository.findOne({id: id, network: network}, {cache: true, relations: ['favorites', 'favorites.quote']});
    }

    async saveEmxliveProfile(network: Network, id: string, meta: object): Promise<Profile> {
        const profile = new Profile();
        profile.network = network;
        profile.id = id;
        profile.username = meta['username'];
        profile.bot = 'EMXLIVE';
        profile.locale = meta['language_code'] === 'en' ? Locale.en : Locale.ru;
        profile.name = [meta['first_name'], meta['last_name']].join(' ');
        await this.profilesRepository.createQueryBuilder()
            .insert()
            .into(Profile)
            .values(profile)
            .onConflict(`("id", "network") DO NOTHING`)
            .returning('*')
            .execute();
        return this.getProfile(network, id);
    }

    async saveProfile(network: Network, id: string, meta: object): Promise<Profile> {
        const profile = new Profile();
        profile.network = network;
        profile.id = id;
        profile.username = meta['username'];
        profile.locale = meta['language_code'] === 'en' ? Locale.en : Locale.ru;
        profile.name = [meta['first_name'], meta['last_name']].join(' ');
        await this.profilesRepository.createQueryBuilder()
            .insert()
            .into(Profile)
            .values(profile)
            .onConflict(`("id", "network") DO NOTHING`)
            .returning('*')
            .execute();
        return this.getProfile(network, id);
    }

    async toggleLanguage(network: Network, id: string) : Promise<Profile> {
        const profile = await this.getProfile(network, id);
        profile.locale = profile.locale === Locale.en ? Locale.ru : Locale.en ;
        return this.profilesRepository.save(profile);
    }

    async saveTimezone(network: Network, id: string, timezone: number) {
        const profile = await this.getProfile(network, id);
        profile.timezone = moment().utcOffset(timezone).format('Z');
        return this.profilesRepository.save(profile);
    }
}
