// #[test_only]
// module numeron::market_test {
//     use numeron::numeron_schema::Schema;
//     use numeron::numeron_position;
//     use sui::random::Random;
//     use sui::random;
//     use sui::test_scenario;
//     use numeron::numeron_map_system;
//     use numeron::numeron_monster_system;
//     use numeron::numeron_init_test;
//     use numeron::numeron_encounter_info;
//     use numeron::numeron_monster_type;
//     use numeron::numeron_item_system;
//     use numeron::numeron_swap_order;
//     use numeron::numeron_item;
//     use numeron::market_system;
//     use sui::clock;
//     use numeron::numeron_trade_order;
//     use numeron::numeron_dapp_key;
//     use sui::coin;
//     use sui::sui::SUI;

//     #[test]
//     fun create_swap_order_should_succeed(){
//         let sender = @0xA;
//         let mut scenario = test_scenario::begin(sender);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);

//         let ctx = test_scenario::ctx(&mut scenario);
//         let clock = clock::create_for_testing(ctx);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 1, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 2, sender, 10);

//         market_system::create_swap_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             vector[0, 1, 2], 
//             vector[1, 1, 1], 
//             &clock, 
//             1000, 
//             ctx
//         );

//         assert!(schema.next_order_id()[] == 1);
//         assert!(schema.swap_order()[0] == numeron_swap_order::new(
//             0,
//             sender,
//             vector[numeron_item::new(0, 2), numeron_item::new(1, 3), numeron_item::new(2, 4)],
//             vector[numeron_item::new(0, 1), numeron_item::new(1, 1), numeron_item::new(2, 1)],
//             clock.timestamp_ms(),
//             clock.timestamp_ms() + 1000
//         ));

//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         clock.destroy_for_testing();
//         scenario.end();
//     }

//     #[test]
//     #[expected_failure(abort_code = numeron::numeron_errors::BALANCE_TOO_LOW)]
//     fun create_swap_order_should_fail(){
//         let sender = @0xA;
//         let mut scenario = test_scenario::begin(sender);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);


//         let ctx = test_scenario::ctx(&mut scenario);
//         let clock = clock::create_for_testing(ctx);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, sender, 10);

//         market_system::create_swap_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0], 
//             vector[11], 
//             vector[0], 
//             vector[1], 
//             &clock, 
//             1000, 
//             ctx
//         );

//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         clock.destroy_for_testing();
//         scenario.end();
//     }

//     #[test]
//     fun create_trade_order_should_succeed(){
//         let sender = @0xA;
//         let mut scenario = test_scenario::begin(sender);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);

//         let ctx = test_scenario::ctx(&mut scenario);
//         let clock = clock::create_for_testing(ctx);

//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 1, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 2, sender, 10);

//         market_system::create_trade_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             10000,
//             &clock,
//             1000,
//             ctx
//         );

//         assert!(schema.next_order_id()[] == 1);
//         assert!(schema.trade_order()[0] == numeron_trade_order::new(
//             0,
//             sender,
//             vector[numeron_item::new(0, 2), numeron_item::new(1, 3), numeron_item::new(2, 4)],
//             10000,
//             clock.timestamp_ms(),
//             clock.timestamp_ms() + 1000
//         ));
        
//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         clock.destroy_for_testing();
//         scenario.end(); 
//     }

//     #[test]
//     fun cancel_order_should_succeed(){
//         let sender = @0xA;
//         let mut scenario = test_scenario::begin(sender);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);


//         let ctx = test_scenario::ctx(&mut scenario);
//         let clock = clock::create_for_testing(ctx);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 1, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 2, sender, 10);

//         assert!(schema.balance()[sender, 0] == 10);
//         assert!(schema.balance()[sender, 1] == 10);
//         assert!(schema.balance()[sender, 2] == 10);

//         market_system::create_swap_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             vector[0, 1, 2], 
//             vector[1, 1, 1], 
//             &clock, 
//             1000, 
//             ctx
//         );

//         assert!(schema.balance()[sender, 0] == 8);
//         assert!(schema.balance()[sender, 1] == 7);
//         assert!(schema.balance()[sender, 2] == 6);

//         market_system::cancel_order(&mut dubhe_schema, &mut schema, 0, ctx);

//         assert!(schema.balance()[sender, 0] == 10);
//         assert!(schema.balance()[sender, 1] == 10);
//         assert!(schema.balance()[sender, 2] == 10);

//         assert!(schema.swap_order().length() == 0);
//         assert!(schema.next_order_id()[] == 1);

//         market_system::create_trade_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             10000,
//             &clock, 
//             1000,
//             ctx
//         );

//         assert!(schema.balance()[sender, 0] == 8);
//         assert!(schema.balance()[sender, 1] == 7);
//         assert!(schema.balance()[sender, 2] == 6);

//         assert!(schema.trade_order().length() == 1);

//         market_system::cancel_order(&mut dubhe_schema, &mut schema, 1, ctx);

//         assert!(schema.balance()[sender, 0] == 10);
//         assert!(schema.balance()[sender, 1] == 10);
//         assert!(schema.balance()[sender, 2] == 10);

//         assert!(schema.trade_order().length() == 0);
//         assert!(schema.next_order_id()[] == 2);

//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         clock.destroy_for_testing();
//         scenario.end();
//     }

//     #[test]
//     fun claim_order_should_succeed(){
//         let sender = @0xA;
//         let mut scenario = test_scenario::begin(sender);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);

//         let ctx = test_scenario::ctx(&mut scenario);
//         let clock = clock::create_for_testing(ctx);

//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 1, sender, 10);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 2, sender, 10);

//         market_system::create_swap_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             vector[0, 1, 2], 
//             vector[1, 1, 1], 
//             &clock, 
//             1000, 
//             ctx
//         );

//         assert!(schema.balance()[sender, 0] == 8);
//         assert!(schema.balance()[sender, 1] == 7);
//         assert!(schema.balance()[sender, 2] == 6);

//         let buyer = @0xB;
//         test_scenario::next_tx(&mut scenario, buyer);
//         let ctx = test_scenario::ctx(&mut scenario);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 0, buyer, 1);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 1, buyer, 1);
//         numeron_item_system::mint(&mut dubhe_schema, &mut schema, 2, buyer, 1);

//         market_system::claim_order(&mut dubhe_schema, &mut schema, 0, &clock, ctx);

//         assert!(schema.balance()[sender, 0] == 9);
//         assert!(schema.balance()[sender, 1] == 8);
//         assert!(schema.balance()[sender, 2] == 7);

//         assert!(schema.balance()[buyer, 0] == 2);
//         assert!(schema.balance()[buyer, 1] == 3);
//         assert!(schema.balance()[buyer, 2] == 4);

//         assert!(schema.swap_order().length() == 0);
//         assert!(schema.next_order_id()[] == 1);

//         market_system::create_trade_order(
//             &mut dubhe_schema, 
//             &mut schema, 
//             vector[0, 1, 2], 
//             vector[2, 3, 4], 
//             10000,
//             &clock, 
//             1000,       
//             ctx
//         );

//         assert!(!schema.balance().contains(buyer, 0));
//         assert!(!schema.balance().contains(buyer, 1));
//         assert!(!schema.balance().contains(buyer, 2));



//         let buyer1 = @0xC;
//         let asset_id = schema.num_asset_id()[];
//         dubhe::dubhe_assets_system::mint_asset(
//             &mut dubhe_schema,
//             numeron_dapp_key::new(),
//             asset_id,
//             buyer1,
//             20000,
//         );
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             asset_id,
//             buyer1,
//         ) == 20000);

//         test_scenario::next_tx(&mut scenario, buyer1);
//         let ctx = test_scenario::ctx(&mut scenario);
//         market_system::claim_order(&mut dubhe_schema, &mut schema, 1, &clock, ctx);
        
//         assert!(schema.balance()[buyer1, 0] == 2);
//         assert!(schema.balance()[buyer1, 1] == 3);
//         assert!(schema.balance()[buyer1, 2] == 4);

//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             asset_id,
//             buyer1,
//         ) == 10000);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             asset_id,
//             buyer,
//         ) == 9900);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             asset_id,
//             sender,
//         ) == 100);

//         assert!(schema.trade_order().length() == 0);
//         assert!(schema.next_order_id()[] == 2);
        
//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         clock.destroy_for_testing();
//         scenario.end();
//     }

//     #[test]
//     fun buy_key_should_succeed(){
//         let deployer = @0xA;
//         let mut scenario = test_scenario::begin(deployer);
//         let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);

//         let num_asset_id = schema.num_asset_id()[];

//         let buyer = @0xB;
//         let dapp_key = numeron_dapp_key::new();
//         dubhe::dubhe_assets_system::mint_asset(
//             &mut dubhe_schema,
//             dapp_key,
//             num_asset_id,
//             buyer,
//             10 * 1000000000,
//         );
//         test_scenario::next_tx(&mut scenario, buyer);
//         let ctx = test_scenario::ctx(&mut scenario);
        
//         market_system::buy_key(&mut dubhe_schema, &mut schema, 1, ctx);
        
//         assert!(schema.balance()[buyer, 11] == 1);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             num_asset_id,
//             buyer,
//         ) == 9 * 1000000000);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             num_asset_id,
//             deployer,
//         ) == 1 * 1000000000);

//         market_system::buy_key(&mut dubhe_schema, &mut schema, 4, ctx);

//         assert!(schema.balance()[buyer, 11] == 5);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             num_asset_id,
//             buyer,
//         ) == 5 * 1000000000);
//         assert!(dubhe::dubhe_assets_system::balance_of(
//             &mut dubhe_schema,
//             num_asset_id,
//             deployer,
//         ) == 5 * 1000000000);

//         test_scenario::return_shared(dubhe_schema);
//         test_scenario::return_shared(schema);
//         scenario.end();
//     }
// }