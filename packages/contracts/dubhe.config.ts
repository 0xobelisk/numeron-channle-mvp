import { DubheConfig, storage } from '@0xobelisk/sui-common';

export const dubheConfig = {
  name: 'numeron',
  description: 'numeron contract',
  data: {
    MonsterType: ["None", "Eagle", "Rat", "Caterpillar"],
    MonsterBallType: ["Poke", "Great", "Ultra"],
    MonsterCatchResult: ["Missed", "Caught"],
    MapConfig: { width: "u64", height: "u64", background: "String" },
    Position: { map_id: "u64", x: "u64", y: "u64" },
    EncounterInfo: { monster_id: "u256", player_monster_id: "u256", is_battling: "bool" },
    Stats: { 
      kill_count: "u256", 
      battle_count: "u256" , 
      capture_failed_count: "u256", 
      capture_success_count: "u256",
      flee_count: "u256",
      release_count: "u256",
      move_count: "u256",
    },
    MonsterInfo: {
      name: "String",
      asset_frame: "u256",
      current_hp: "u256",
      max_hp: "u256",
      attack_ids: "vector<u64>",
      base_attack: "u256",
      current_attack: "u256",
      current_level: "u256",
      base_exp: "u256",
      current_exp: "u256"
    },
    ItemType: [
      "Medicine", 
      "Food",    
      "Ball",     
      "Material", 
      "SkillBook",
      "Currency", 
      "Scroll",   
      "TreasureChest" 
    ],
    ItemMetadata: {
      item_type: "ItemType",
      icon_url: "String",
      name: "String",
      description: "String",
      is_transferable: "bool"
    },
    Item: {
      id: "u256",
      quantities: "u256",
    },
    ItemDrop: {
      item_ids: "vector<u256>",
      quantities: "vector<u256>",
      actual_rates: "vector<u256>",
      rates: "vector<u256>",
    },
    CraftPath: {
      input_item_ids: "vector<u256>",
      input_quantities: "vector<u256>",
      output_quantities: "u256",
    },
    SwapOrder: {
      id: "u256",
      creator: "address",
      items: "vector<Item>",
      expected_items: "vector<Item>",
      created_at: "u64",
      expired_at: "u64",
    },
    TradeOrder: {
      id: "u256",
      creator: "address",
      items: "vector<Item>",
      price: "u256",
      created_at: "u64",
      expired_at: "u64",
    }
  },
  errors: {
    cannot_move: "This entity cannot move",
    already_registered: "This address is already registered",
    not_registered: "This address is not registered",
    space_obstructed: "This space is obstructed",
    already_in_encounter: "This player already in an encounter",
    not_in_encounter: "This player is not in an encounter",
    invalid_direction: "Invalid direction",
    invalid_choice: "Invalid choice",
    balance_too_low: "Balance too low",
    not_in_current_map: "Player is not in the current map",
    not_your_monster: "This monster does not belong to you",
    monster_not_found: "Monster not found",
    atleast_one_monster: "At least one monster is required",
    item_not_found: "Monster not found",
    already_in_battle: "This monster is already in battle",
    not_teleport_point: "This is not a teleport point",
    invalid_item_parameters: "Invalid item parameters",
    order_not_found: "Order not found",
    order_expired: "Order expired",
    not_your_order: "This order does not belong to you",
    not_exist_live_monster: "This player does not have a live monster",
    invalid_key_amount: "Invalid key amount",
  },
  events: {
    item_dropped: {
      name: "String",
      player: 'address',
      item_id: 'u256',
      quantities: 'u256',
      random: 'u256',
    },
    player_registered: {
      player: 'address',
      position: 'Position'
    },
    monster_catch_attempt: {
      player: 'address',
      monster_id: 'u256',
      result: 'MonsterCatchResult',
    }
  },
  schemas: {
    // player => encounter info
    encounter: storage('address', 'EncounterInfo'),
    // monster type
    encounter_monster: storage('vector<MonsterInfo>'),
    player: storage('address', 'bool'),

    obstruction: storage('Position', 'bool'),
    encounter_trigger: storage('Position', 'bool'),
    map_layer: storage('u64', 'String', 'vector<u8>'),
    map_config: storage('u64', 'MapConfig'),
    position: storage('address', 'Position'),
    
    // monster_id => monster info
    monster: storage('u256', 'MonsterInfo'),
    next_monster_id: storage('u256'),
    next_item_id: storage('u256'),
    monster_owned_by: storage('address', 'vector<u256>'),
    // player + item_id => item quantities
    balance: storage('address', 'u256', 'u256'),
    // item_id => item metadata    
    item_metadata: storage('u256', 'ItemMetadata'),
    move_item_drop_config: storage('ItemDrop'),
    chest_item_drop_config: storage('u256', 'ItemDrop'),
    encounter_item_drop_config: storage('ItemDrop'),
    item_craft_path: storage('u256', 'CraftPath'),
    // Teleport Point
    teleport_point: storage('Position', 'Position'),

    // player => stats
    stats: storage('address', 'Stats'),

    // order_id  => order
    swap_order: storage('u256', 'SwapOrder'),
    trade_order: storage('u256', 'TradeOrder'),
    next_order_id: storage('u256'),
    // diamond asset id
    num_asset_id: storage('u256'),
    key_price: storage('u256'),
    order_fee_rate: storage('u256'),
  },
  plugins: ['merak']
} as DubheConfig;
