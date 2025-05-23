module numeron::numeron_map_system;

use numeron::numeron_schema::Schema;
use sui::random::{Random, RandomGenerator};
use sui::random;
use numeron::numeron_monster_info;
use numeron::numeron_encounter_info;
use std::ascii::string;
use numeron::numeron_position;
use numeron::numeron_monster_type;
use numeron::numeron_stats;
use numeron::numeron_monster_system;
use numeron::numeron_events::{player_registered_event, item_dropped_event};
use numeron::numeron_errors::{space_obstructed_error, already_registered_error, not_registered_error, not_in_current_map_error,
    already_in_encounter_error, cannot_move_error, invalid_direction_error, not_teleport_point_error, not_exist_live_monster_error
};
use numeron::numeron_item_system;
use dubhe::dubhe_schema::Schema as DubheSchema;
use numeron::numeron_dapp_key;


entry fun register(dubhe_schema: &mut DubheSchema, schema: &mut Schema, map_id: u64, x: u64, y: u64, ctx: &TxContext) {
    let player = ctx.sender();

    already_registered_error(!schema.player().contains(player));

    let position = numeron_position::new(map_id, x, y);
    space_obstructed_error(!schema.obstruction().contains(position));
    let dapp_key = numeron_dapp_key::new();
    schema.player().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        true
    );
    schema.position().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        position
    );
    schema.monster_owned_by().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        vector[]
    );
    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        numeron_stats::new(0, 0, 0, 0, 0, 0, 0)
    );
    player_registered_event(player, position);
}

entry fun switch_map(dubhe_schema: &mut DubheSchema, schema: &mut Schema, map_id: u64, ctx: &TxContext) {
    let player = ctx.sender();
    not_registered_error(schema.player().contains(player));
    not_in_current_map_error(schema.position().contains(player));
    let position = schema.position()[player];
    let dapp_key = numeron_dapp_key::new();
    schema.position().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        position
    );
}

public entry fun teleport(dubhe_schema: &mut DubheSchema, schema: &mut Schema, ctx: &TxContext) {
    let player = ctx.sender();
    not_registered_error(schema.player().contains(player));
    not_in_current_map_error(schema.position().contains(player));
    let current_position = schema.position()[player];

    not_teleport_point_error(schema.teleport_point().contains(current_position));

    let dapp_key = numeron_dapp_key::new();
    not_exist_live_monster_error(numeron_monster_system::is_exist_live_monster(schema, player));

    let target_position = schema.teleport_point()[current_position];
    schema.position().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        target_position
    );
}

fun start_encounter(dubhe_schema: &mut DubheSchema, schema: &mut Schema, generator: &mut RandomGenerator, player: address) {
    let rand = random::generate_u256(generator);
    let monster_id = schema.next_monster_id()[];
    let monster_index: u64 = (rand % (schema.encounter_monster()[].length() as u256)) as u64;
    let monster = schema.encounter_monster()[][monster_index];
    let dapp_key = numeron_dapp_key::new();
    schema.monster().set(
        dubhe_schema, 
        dapp_key, 
        monster_id, 
        monster
    );
    let player_monster_id = numeron_monster_system::get_first_live_monster(schema, player);
    schema.encounter().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        numeron_encounter_info::new(monster_id, player_monster_id, false)
    );
    schema.next_monster_id().set(
        dubhe_schema, 
        dapp_key, 
        monster_id + 1
    );
}

entry fun move_position(dubhe_schema: &mut DubheSchema, schema: &mut Schema, random: &Random, direction: u8, ctx: &mut TxContext) {
    let player = ctx.sender();
    not_registered_error(schema.player().contains(player));
    already_in_encounter_error(!schema.encounter().contains(player));
    not_in_current_map_error(schema.position().contains(player));

    let (map_id, mut x, mut y) = schema.position()[player].get();
    match (direction) {
        // north
        0 => y = y - 1,
        // south
        1 => y = y + 1,
        // west
        2 => x = x - 1,
        // east
        3 => x = x + 1,
        _ => invalid_direction_error(false),
    };

    let position = numeron_position::new(map_id, x, y);
    space_obstructed_error(!schema.obstruction().contains(position));

    let dapp_key = numeron_dapp_key::new();
    schema.position().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        position
    );

    let mut generator = random::new_generator(random, ctx);
    if(schema.encounter_trigger().contains(position)) {
        let rand = random::generate_u128(&mut generator);
        std::debug::print(&rand);
        if (rand % 2 == 0) {
            start_encounter(dubhe_schema, schema, &mut generator, player);
        }
    } else {
        numeron_item_system::move_random_item_drop(dubhe_schema, schema, &mut generator, player);
    };

    let mut stats = schema.stats()[player];
    let move_count = stats.get_move_count();
    stats.set_move_count(move_count + 1);
    schema.stats().set(
        dubhe_schema, 
        dapp_key, 
        player, 
        stats
    );
}

// #[test_only]
// use numeron::init_test;
// #[test_only]
// use sui::test_scenario;
//
// #[test]
// fun move_position_should_work(){
//     let (mut scenario, dapp) = init_test::deploy_dapp_for_testing(@0x0);
//     let mut schema = test_scenario::take_shared<Schema>(&scenario);
//     {
//         random::create_for_testing(scenario.ctx());
//         scenario.next_tx(@0xA);
//     };
//     let random = test_scenario::take_shared<Random>(&scenario);
//
//     let ctx = test_scenario::ctx(&mut scenario);
//     register(&mut schema, 8, 3, ctx);
//
//     move_position(&mut schema, &random, 1, ctx);
//     assert!(schema.position()[ctx.sender()] == numeron_position::new(8, 4));
//     assert!(schema.balance()[ctx.sender()] == 1);
//
//     move_position(&mut schema, &random, 1, ctx);
//     assert!(schema.position()[ctx.sender()] == numeron_position::new(8, 5));
//     assert!(schema.balance()[ctx.sender()] == 2);
//
//     // 23140719614837502849299678247283568217
//     // 265323129722700274815559996314403104838
//     // 167645769845140257622894197850400210971
//     // 337352614844298231097611607824428697695
//     // 143043683458825263308720013747056599257
//     // 97853292883519077516783190366887388411
//     // 226059294092153697833364734032968362880
//
//     move_position(&mut schema, &random, 3, ctx);
//     move_position(&mut schema, &random, 3, ctx);
//     assert!(schema.balance()[ctx.sender()] == 2);
//     let expect_monster_address = @0x0;
//     let expect_monster_type = monster_type::new_rat();
//     assert!(schema.monster().get(expect_monster_address) == expect_monster_type);
//     assert!(schema.encounter().get(ctx.sender()) == numeron_encounter_info::new(expect_monster_address, 0));
//
//     test_scenario::return_shared(schema);
//     test_scenario::return_shared(random);
//     dapp.distroy_dapp_for_testing();
//     scenario.end();
// }