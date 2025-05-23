module numeron::numeron_encounter_system;

use numeron::numeron_schema::Schema;
use numeron::numeron_position;
use numeron::numeron_item_system;
use numeron::numeron_encounter_info;
use numeron::numeron_monster_catch_result;
use numeron::numeron_monster_info;
use numeron::numeron_events::{
    monster_catch_attempt_event
};
use numeron::numeron_errors::{
    not_in_encounter_error,not_your_monster_error, monster_not_found_error, already_in_battle_error
};
use numeron::numeron_monster_system;
use sui::random::Random;
use sui::random;
use std::ascii::string;
use dubhe::dubhe_schema::Schema as DubheSchema;
use numeron::numeron_dapp_key;

entry fun battle(dubhe_schema: &mut DubheSchema, schema: &mut Schema, random: &Random, ctx: &mut TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();

    not_in_encounter_error(schema.encounter().contains(player));
    not_your_monster_error(schema.monster_owned_by()[player].length() > 0);

    let (encounter_monster_id, player_monster_id, is_battling) = schema.encounter()[player].get();
    if(!is_battling) {
        schema.encounter().set(
            dubhe_schema, 
            dapp_key, 
            player, 
            numeron_encounter_info::new(encounter_monster_id, player_monster_id, true)
        );
    };

    let mut stats = schema.stats()[player];
    let kill_count = stats.get_kill_count();
    let battle_count = stats.get_battle_count();
    // Update battle count
    stats.set_battle_count(battle_count + 1);

    let new_encounter_hp = numeron_monster_system::encounter_player_attack(dubhe_schema, schema, player);
    let encounter_monster = schema.monster()[encounter_monster_id];
    let player_monster = schema.monster()[player_monster_id];

    if (new_encounter_hp == 0) {
        // Update kill count
        stats.set_kill_count(kill_count + 1);
        // Remove encounter
        schema.encounter().remove(player);
        // Remove monster
        schema.monster().remove(encounter_monster_id);
        // Drop item
        let mut generator = random::new_generator(random, ctx);
        numeron_item_system::encounter_random_item_drop(
            dubhe_schema, 
            schema, 
            &mut generator, 
            player, 
            player_monster, 
            encounter_monster);
    } else {
        // Monster attack
        numeron_monster_system::encounter_monster_attack(dubhe_schema, schema, player);
    };

    // Update encounter stats
    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        stats
    );
}

entry fun capture(dubhe_schema: &mut DubheSchema, schema: &mut Schema, random: &Random, ball_item_id: u256,  ctx: &mut TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();
    not_in_encounter_error(schema.encounter().contains(player));

    numeron_item_system::burn(
        dubhe_schema, 
        schema, 
        ball_item_id, 
        player, 
        1
    );

    let encounter_monster_id = schema.encounter()[player].get_monster_id();
    let (_, _, current_hp, max_hp, _, _, _, _, _, _) = schema.monster()[encounter_monster_id].get();

    let mut generator = random::new_generator(random, ctx);
    let rand = random::generate_u256(&mut generator);
    let rand_value = (rand % 1000) + 1;

    let (base_capture_rate, max_capture_rate) = if (ball_item_id == 4) {
        (100, 400) // Low-Level Ball: Base 10%, Max 40%
    } else if (ball_item_id == 5) {
        (200, 600) // Mid-Level Ball: Base 20%, Max 60%
    } else if (ball_item_id == 6) {
        (300, 800) // High-Level Ball: Base 30%, Max 80%
    } else {
        (100, 400)
    };

    let hp_percent = current_hp * 1000 / max_hp;
    let hp_remaining_factor = 1000 - hp_percent;
    let hp_bonus = hp_remaining_factor * (max_capture_rate - base_capture_rate) / 1000;

    let total_capture_rate = base_capture_rate + hp_bonus;
    let final_capture_rate = if (total_capture_rate > max_capture_rate) { max_capture_rate } else { total_capture_rate };

    std::debug::print(&final_capture_rate);

    let mut stats = schema.stats()[player];
    let capture_failed_count = stats.get_capture_failed_count();
    let capture_success_count = stats.get_capture_success_count();

    // Monster captured successfully
    if (rand_value <= final_capture_rate) {
        schema.encounter().remove(player);
        let mut monsters = schema.monster_owned_by()[player];
        monsters.push_back(encounter_monster_id);
        schema.monster_owned_by().set(
            dubhe_schema, 
            dapp_key, 
            player, 
            monsters
        );
        std::debug::print(&string(b"Monster captured successfully!"));
        monster_catch_attempt_event(player, encounter_monster_id, numeron_monster_catch_result::new_caught());
        stats.set_capture_success_count(capture_success_count + 1);
    // Capture failed!
    } else {
        std::debug::print(&string(b"Capture failed!"));
        monster_catch_attempt_event(player, encounter_monster_id, numeron_monster_catch_result::new_missed());
        numeron_monster_system::encounter_monster_attack(dubhe_schema, schema, player);
        stats.set_capture_failed_count(capture_failed_count + 1);
    };

    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        stats
    );
}

entry fun flee(dubhe_schema: &mut DubheSchema, schema: &mut Schema, forced: bool, ctx: &TxContext) {
    let player = ctx.sender();
    let dapp_key = numeron_dapp_key::new();

    not_in_encounter_error(schema.encounter().contains(player));
    let (monster_id, _, is_battling) = schema.encounter()[player].get();

    if (forced && is_battling) {
        numeron_item_system::burn(
            dubhe_schema, 
            schema, 
            5, 
            player, 
            1
        );
    } else {
        already_in_battle_error(!is_battling);
    };

    schema.encounter().remove(player);
    schema.monster().remove(monster_id);

    let mut stats = schema.stats()[player];
    let flee_count = stats.get_flee_count();
    stats.set_flee_count(flee_count + 1);
    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        stats
    );
}