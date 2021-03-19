import { Module } from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ProfilesService} from "./profiles.service";
import {Profile} from "./entity/profile";
import {Chat} from "./entity/chat";

@Module({
    imports: [TypeOrmModule.forFeature([Profile, Chat])],
    providers: [ProfilesService],
    exports: [ProfilesService],
})
export class UsersModule {}
