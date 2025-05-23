module numeron::numeron_monster_system;

use numeron::numeron_schema::Schema;
use numeron::numeron_monster_info;
use numeron::numeron_encounter_info;
use std::ascii::string;
use numeron::numeron_item_system;
use numeron::numeron_position;
use numeron::numeron_errors::{monster_not_found_error, not_your_monster_error, not_in_encounter_error, balance_too_low_error, item_not_found_error, atleast_one_monster_error, already_in_encounter_error, not_exist_live_monster_error};
use dubhe::dubhe_schema::Schema as DubheSchema;
use numeron::numeron_dapp_key;

entry fun claim_monster(dubhe_schema: &mut DubheSchema, schema: &mut Schema, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();

    let monster_id = schema.next_monster_id()[];

    let monster = schema.encounter_monster()[][0];
    schema.monster().set(
        dubhe_schema, 
        dapp_key, 
        monster_id, 
        monster
    );

    let mut monsters = schema.monster_owned_by()[player];
    monsters.push_back(monster_id);
    schema.monster_owned_by().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        monsters
    );
    schema.next_monster_id().set(
        dubhe_schema, 
        dapp_key, 
        monster_id + 1
    );
}

public entry fun select_monster(dubhe_schema: &mut DubheSchema, schema: &mut Schema, monster_index: u64, expected_monster_index: u64, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();
    not_your_monster_error(schema.monster_owned_by().contains(player));
    let len = schema.monster_owned_by()[player].length();
    not_your_monster_error(monster_index < len);
    not_your_monster_error(expected_monster_index < len);
    let mut monsters = schema.monster_owned_by()[player];
    monsters.swap(monster_index, expected_monster_index);
    schema.monster_owned_by().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        monsters
    );
}

public entry fun select_monster_for_encounter(dubhe_schema: &mut DubheSchema, schema: &mut Schema, monster_index: u64, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();
    not_in_encounter_error(schema.encounter().contains(player));
    let len = schema.monster_owned_by()[player].length();
    not_your_monster_error(monster_index < len);
    let mut monsters = schema.monster_owned_by()[player];
    let monster_id = monsters[monster_index];
    let (encounter_monster_id, player_monster_id, is_battling) = schema.encounter()[player].get();
    schema.encounter().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        numeron_encounter_info::new(encounter_monster_id, monster_id, is_battling)
    );
    let player_monster = schema.monster()[player_monster_id];
    if(player_monster.get_current_hp() != 0) { 
        encounter_monster_attack(dubhe_schema, schema, player);
    };
}

public entry fun release_monster(dubhe_schema: &mut DubheSchema, schema: &mut Schema, monster_id: u256, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();
    not_your_monster_error(schema.monster_owned_by()[player].contains(&monster_id));
    let mut monsters = schema.monster_owned_by()[player];
    atleast_one_monster_error(monsters.length() > 1);
    let (_, index) = monsters.index_of(&monster_id);
    monsters.remove(index);
        schema.monster_owned_by().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        monsters
    );
    let mut stats = schema.stats()[player];
    let release_count = stats.get_release_count();
    stats.set_release_count(release_count + 1);
    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        stats
    );
}

public entry fun enhance_monster(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, monster_id: u256, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();
    monster_not_found_error(schema.monster().contains(monster_id));
    not_your_monster_error(schema.monster_owned_by()[player].contains(&monster_id));

    if(schema.encounter().contains(player)) {
        let player_monster = schema.monster()[monster_id];
        already_in_encounter_error(player_monster.get_current_hp() > 0);
    };

    let (name, asset_frame, mut current_hp, max_hp, attack_ids, base_attack, current_attack, current_level, base_exp, current_exp) = schema.monster()[monster_id].get();
    if(item_id == 1) {
        current_hp = max_hp;
    } else if(item_id == 2) {
        current_hp = (current_hp + max_hp / 2).min(max_hp);
    };
    let new_monster = numeron_monster_info::new(name, asset_frame, current_hp, max_hp, attack_ids, base_attack, current_attack, current_level, base_exp, current_exp);
    schema.monster().set(
        dubhe_schema, 
        dapp_key, 
        monster_id, 
        new_monster
    );
    numeron_item_system::burn(
        dubhe_schema, 
        schema, 
        item_id, 
        player, 
        1
    );

    if(schema.encounter().contains(player)) {
        encounter_monster_attack(dubhe_schema, schema, player);
    };
}

public(package) fun is_exist_live_monster(schema: &mut Schema, player: address): bool {
    let monsters = schema.monster_owned_by()[player];
    let mut is_exist = false;
    let mut i = 0;
    while(i < monsters.length()) {
        let monster = schema.monster()[monsters[i]];
        let (_, _, current_hp, _, _, _, _, _, _, _) = monster.get();
        if(current_hp > 0) {
            is_exist = true;
            break
        };
        i = i + 1;
    };
    is_exist
}

public(package) fun get_first_live_monster(schema: &mut Schema, player: address): u256 {
    let monsters = schema.monster_owned_by()[player];
    let mut i = 0;
    while(i < monsters.length()) {
        let monster = schema.monster()[monsters[i]];
        let (_, _, current_hp, _, _, _, _, _, _, _) = monster.get();
        if(current_hp > 0) {
            return monsters[i]
        };
        i = i + 1;
    };
    not_exist_live_monster_error(false);
    0
}

public(package) fun encounter_monster_attack(dubhe_schema: &mut DubheSchema, schema: &mut Schema, player: address) {
    let dapp_key = numeron_dapp_key::new();
    let (encounter_monster_id, player_monster_id, _) = schema.encounter()[player].get();
    let encounter_monster = schema.monster()[encounter_monster_id];
    let player_monster = schema.monster()[player_monster_id];
    let encounter_monster_current_attack = encounter_monster.get_current_attack();
    let (player_name, player_frame, player_monster_current_hp, player_max_hp, player_attack_ids, player_base_attack, player_current_attack, player_current_level, player_base_exp, player_current_exp) = player_monster.get();
    let new_player_monster_current_hp = if(player_monster_current_hp <= encounter_monster_current_attack) { 0 } else { player_monster_current_hp - encounter_monster_current_attack };
    let new_player_monster = numeron_monster_info::new(player_name, player_frame, new_player_monster_current_hp, player_max_hp, player_attack_ids, player_base_attack, player_current_attack, player_current_level, player_base_exp, player_current_exp);
    schema.monster().set(
        dubhe_schema, 
        dapp_key, 
        player_monster_id, 
        new_player_monster
    );
    if (new_player_monster_current_hp == 0 && !is_exist_live_monster(schema, player)) {
        schema.encounter().remove(player);
        schema.monster().remove(encounter_monster_id);
        schema.position().set(
            dubhe_schema, 
            dapp_key, 
            player, 
            numeron_position::new(1, 9, 4)
        );
   }
}


public(package) fun encounter_player_attack(dubhe_schema: &mut DubheSchema, schema: &mut Schema, player: address): u256 {
    let dapp_key = numeron_dapp_key::new();
    let (encounter_monster_id, player_monster_id, _) = schema.encounter()[player].get();
    let encounter_monster = schema.monster()[encounter_monster_id];
    let player_monster = schema.monster()[player_monster_id];
    let player_monster_current_attack = player_monster.get_current_attack();
    let (encounter_monster_name, encounter_monster_frame, encounter_monster_current_hp, encounter_monster_max_hp, encounter_monster_attack_ids, encounter_monster_base_attack, encounter_monster_current_attack, encounter_monster_current_level, encounter_monster_base_exp, encounter_monster_current_exp) = encounter_monster.get();
    let new_encounter_monster_current_hp = if(encounter_monster_current_hp <= player_monster_current_attack) { 0 } else { encounter_monster_current_hp - player_monster_current_attack };
    let new_encounter_monster = numeron_monster_info::new(encounter_monster_name, encounter_monster_frame, new_encounter_monster_current_hp, encounter_monster_max_hp, encounter_monster_attack_ids, encounter_monster_base_attack, encounter_monster_current_attack, encounter_monster_current_level, encounter_monster_base_exp, encounter_monster_current_exp);
    schema.monster().set(
        dubhe_schema, 
        dapp_key, 
        encounter_monster_id, 
        new_encounter_monster
    );
    new_encounter_monster_current_hp
}
