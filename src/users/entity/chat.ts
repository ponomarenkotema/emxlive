import {Column, Entity, ManyToOne, PrimaryColumn} from "typeorm";
import {Network, Profile} from "./profile";

@Entity("chats")
export class Chat {
    @PrimaryColumn()
    id: string;

    @Column()
    title: string;

    @Column({type: 'varchar', length: 1024, nullable: false})
    profileId: string;

    @Column({
        type: 'varchar',
        length: 64,
        default: "telegram"
    })
    profileNetwork: Network;

    @ManyToOne(type => Profile, profile => profile.chats)
    profile: Profile;
}
