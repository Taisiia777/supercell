export interface IProfile {
    id: number
    game_email: {
        brawl_stars?: string
        clash_of_clans?: string
        clash_royale?: string
        stumble_guys?: string
    }
    first_name?: string
    last_name?: string
}