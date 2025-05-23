module numeron::numeron_item_system;
use numeron::numeron_schema::Schema;
use numeron::numeron_errors::{
    balance_too_low_error
};
use numeron::numeron_item_type::ItemType;
use numeron::numeron_item_metadata;
use numeron::numeron_craft_path;
use numeron::numeron_item_drop;
use std::ascii::String;
use sui::random::{RandomGenerator, Random};
use numeron::numeron_events::item_dropped_event;
use sui::random;
use std::ascii::string;
use numeron::numeron_monster_info::MonsterInfo;
use dubhe::dubhe_schema::Schema as DubheSchema;
use numeron::numeron_dapp_key;

public fun register(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_ty: ItemType, icon_url: String, name: String, description: String, is_transferable: bool) {
    let dapp_key = numeron_dapp_key::new();
    let item_id = schema.next_item_id()[];
    schema.item_metadata().set(
      dubhe_schema, 
      dapp_key, 
      item_id, 
      numeron_item_metadata::new(
        item_ty,
        icon_url,
        name,
        description,
        is_transferable
    ));
    schema.next_item_id().set(
      dubhe_schema, 
      dapp_key, 
      item_id + 1
    );
}

public fun update_move_drop_config(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_ids: vector<u256>, quantities: vector<u256>, actual_rates: vector<u256>, ctx: &TxContext) {
    // TODO: Check if the sender is the owner of the item
    let mut rates = vector::empty<u256>();
    let mut total = 0;
    let len = vector::length(&quantities);
    let mut i = 0;

    while (i < len) {
        let rate = actual_rates[i];
        total = total + rate;
        rates.push_back(total);
        i = i + 1;
    };
    let dapp_key = numeron_dapp_key::new();
    schema.move_item_drop_config().set(
      dubhe_schema, 
      dapp_key, 
      numeron_item_drop::new(item_ids, quantities, actual_rates, rates)
    );
}

public fun update_chest_drop_config(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, item_ids: vector<u256>, quantities: vector<u256>, actual_rates: vector<u256>, ctx: &TxContext) {
    // TODO: Check if the sender is the owner of the item
    let mut rates = vector::empty<u256>();
    let mut total = 0;
    let len = vector::length(&quantities);
    let mut i = 0;

    while (i < len) {
        let rate = actual_rates[i];
        total = total + rate;
        rates.push_back(total);
        i = i + 1;
    };
    let dapp_key = numeron_dapp_key::new();
    schema.chest_item_drop_config().set(
      dubhe_schema, 
      dapp_key, 
      item_id,
      numeron_item_drop::new(item_ids, quantities, actual_rates, rates)
    );
}

public fun update_encounter_drop_config(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_ids: vector<u256>, quantities: vector<u256>, actual_rates: vector<u256>, ctx: &TxContext) {
    let mut rates = vector::empty<u256>();
    let mut total = 0;
    let len = vector::length(&quantities);
    let mut i = 0;

    while (i < len) {
        let rate = actual_rates[i];
        total = total + rate;
        rates.push_back(total);
        i = i + 1;
    };
    let dapp_key = numeron_dapp_key::new();
    schema.encounter_item_drop_config().set(
      dubhe_schema, 
      dapp_key, 
      numeron_item_drop::new(item_ids, quantities, actual_rates, rates)
    );
}

public fun update_craft_path(dubhe_schema: &mut DubheSchema, schema: &mut Schema, expect_item_id: u256, item_ids: vector<u256>, quantity: vector<u256>, output_quantity: u256, ctx: &TxContext) {
    let dapp_key = numeron_dapp_key::new();
    schema.item_craft_path().set(
      dubhe_schema, 
      dapp_key, 
      expect_item_id, 
      numeron_craft_path::new(item_ids, quantity, output_quantity)
    );
}

public fun move_random_item_drop(dubhe_schema: &mut DubheSchema, schema: &mut Schema, generator: &mut RandomGenerator, player: address) {
    let (item_ids, quantities, actual_rates, _) = schema.move_item_drop_config()[].get();
    let rand = random::generate_u256(generator);
    let rand_value = (rand % 10000) + 1;  // 生成1-10000的随机数
    std::debug::print(&rand_value);

    let len = item_ids.length();
    let mut i = 0;
    let mut total_prob = 0;
    while (i < len) {
        let prob = actual_rates[i];
        total_prob = total_prob + prob;
        if (rand_value <= total_prob) {
            let item_id = item_ids[i];
            let item_quantity = quantities[i];
            mint(dubhe_schema, schema, item_id, player, item_quantity);
            item_dropped_event(string(b"Move"), player, item_id, item_quantity, rand_value);
            break
        };
        i = i + 1;
    };
    // 如果随机数大于总概率，则不掉落任何物品
}

public fun encounter_random_item_drop(dubhe_schema: &mut DubheSchema, schema: &mut Schema, generator: &mut RandomGenerator, player: address, player_mounster: MonsterInfo, encounter_monster: MonsterInfo) {
    let (item_ids, quantities, _, rates) = schema.encounter_item_drop_config()[].get();
    let rand = random::generate_u256(generator);
    let rand_value = (rand % 1000) + 1;
    std::debug::print(&rand_value);

    let (_, _, _, player_max_hp, _, _, player_current_attack, _, _, _) = player_mounster.get();
    let (_, _, _, encounter_max_hp, _, _, encounter_current_attack, _, _, _) = encounter_monster.get();

    let hp_diff = if (encounter_max_hp > player_max_hp) {
        (encounter_max_hp - player_max_hp) * 100 / player_max_hp
    } else {
        0
    };
    let attack_diff = if (encounter_current_attack > player_current_attack) {
        (encounter_current_attack - player_current_attack) * 100 / player_current_attack
    } else {
        0
    };

    // Every 10% difference increases the drop rate by 1%
    let boost = (hp_diff + attack_diff) / 10;
    // Limit the maximum boost to 5%
    let boost = if (boost > 50) { 50 } else { boost };
    std::debug::print(&boost);

    let len = item_ids.length();
    let mut i = 0;
    while (i < len) {
        let base_prob = rates[i];
        // Adjust the drop rate based on the difference between the player and encounter monster
        let adjusted_prob = base_prob + boost;
        std::debug::print(&adjusted_prob);
        if (rand_value <= adjusted_prob) {
            let item_id = item_ids[i];
            let item_quantity = quantities[i];
            mint(dubhe_schema, schema, item_id, player, item_quantity);
            item_dropped_event(string(b"Encounter"), player, item_id, item_quantity, rand_value);
            break
        };
        i = i + 1;
    };
}

public(package) fun mint(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, to: address, quantity: u256) {
    let dapp_key = numeron_dapp_key::new();
    // TODO: Item must exist
    let mut maybe_balance = schema.balance().try_get(to, item_id);
    if (maybe_balance.is_some()) {
        let balance = maybe_balance.extract();
        schema.balance().set(
          dubhe_schema, 
          dapp_key, 
          to, 
          item_id, 
          balance + quantity
        );
    } else {
        schema.balance().set(
          dubhe_schema, 
          dapp_key, 
          to, 
          item_id, 
          quantity
        );
    }
}

public(package) fun burn(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, from: address, quantity: u256) {
    let dapp_key = numeron_dapp_key::new();
    // TODO: Item must exist
    let mut maybe_balance = schema.balance().try_get(from, item_id);
    balance_too_low_error(maybe_balance.is_some());
    let balance = maybe_balance.extract();
    balance_too_low_error(balance >= quantity);
    if(balance == quantity) {
        schema.balance().remove(from, item_id);
    } else {
        schema.balance().set(
          dubhe_schema, 
          dapp_key, 
          from, 
          item_id, 
          balance - quantity
        );
    }
}

public(package) fun transfer(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, from: address, to: address, quantity: u256) { 
    burn(dubhe_schema, schema, item_id, from, quantity);
    mint(dubhe_schema, schema, item_id, to, quantity);
}

public entry fun craft(dubhe_schema: &mut DubheSchema, schema: &mut Schema, expect_item_id: u256, ctx: &TxContext) {
    let from = ctx.sender();

    let (expect_item_ids, expect_quantity, output_quantity) = schema.item_craft_path()[expect_item_id].get();

    let len = expect_item_ids.length();
    let mut i = 0;
    while (i < len) {
        let item_id = expect_item_ids[i];
        let item_quantity = expect_quantity[i];
        burn(dubhe_schema, schema, item_id, from, item_quantity);
        i = i + 1;
    };

    mint(dubhe_schema, schema, expect_item_id, from, output_quantity);
}

/// Open a treasure chest and get a random item
/// Treasure Chest item will be burned
public entry fun open_treasure_chest(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_id: u256, random: &Random, ctx: &mut TxContext) {
    let player = ctx.sender();
    let (item_ids, quantities, _, rates) = schema.chest_item_drop_config()[item_id].get();
    let mut generator = random::new_generator(random, ctx);
    let rand = random::generate_u256(&mut generator);
    let rand_value = (rand % 1000) + 1;
    std::debug::print(&rand_value);

    let len = item_ids.length();
    let mut i = 0;
    while (i < len) {
        let prob = rates[i];
        std::debug::print(&prob);
        if (rand_value <= prob) {
            let item_id = item_ids[i];
            let item_quantity = quantities[i];
            burn(dubhe_schema, schema, 11, player, 1);
            mint(dubhe_schema, schema, item_id, player, item_quantity);
            item_dropped_event(string(b"Treasure Chest"), player, item_id, item_quantity, rand_value);
            break
        };
        i = i + 1;
    };
}