// #[test_only]
// module numeron::encounter_test {
//     use sui::random::Random;
//     use sui::random;
//     use sui::test_scenario;
//     use numeron::map_system;
//     use numeron::encounter_system;
//     use numeron::init_test;
//     use numeron::schema::Schema;
//
//     #[test]
//     public fun throw_ball(){
//         let (mut scenario, dapp) = init_test::deploy_dapp_for_testing(@0x0);
//         {
//             random::create_for_testing(scenario.ctx());
//             scenario.next_tx(@0xA);
//         };
//
//         let mut schema = test_scenario::take_shared<Schema>(&scenario);
//         let random = test_scenario::take_shared<Random>(&scenario);
//
//         let ctx = test_scenario::ctx(&mut scenario);
//         numeron_map_system::register(&mut schema, 8, 3, ctx);
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//
//         // Cannot move during an encounter
//         let encounter_info = schema.encounter()[ctx.sender()];
//         assert!(schema.encounter().get(ctx.sender()).get_catch_attempts() == 0);
//         encounter_system::throw_ball(&mut schema, &random, ctx);
//         assert!(schema.encounter().get(ctx.sender()).get_catch_attempts() == 1);
//         encounter_system::throw_ball(&mut schema, &random, ctx);
//         assert!(schema.encounter().get(ctx.sender()).get_catch_attempts() == 2);
//         encounter_system::throw_ball(&mut schema, &random, ctx);
//
//         assert!(schema.encounter().contains(ctx.sender()) == false);
//         assert!(schema.monster().contains(encounter_info.get_monster_id()) == false);
//
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//
//         encounter_system::throw_ball(&mut schema, &random, ctx);
//         let expect_monster_id = 0;
//         let expect_monster_type = numeron::monster_type::new_eagle();
//         assert!(schema.monster().get(expect_monster_id) == expect_monster_type);
//         assert!(schema.monster_owned_by().get(expect_monster_id) == ctx.sender());
//         assert!(schema.encounter().contains(ctx.sender()) == false);
//
//         test_scenario::return_shared(random);
//         test_scenario::return_shared(schema);
//
//         dapp.distroy_dapp_for_testing();
//         scenario.end();
//     }
//
//     #[test]
//     public fun flee(){
//         let (mut scenario, dapp) = init_test::deploy_dapp_for_testing(@0x0);
//         {
//             random::create_for_testing(scenario.ctx());
//             scenario.next_tx(@0xA);
//         };
//
//         let mut schema = test_scenario::take_shared<Schema>(&scenario);
//         let random = test_scenario::take_shared<Random>(&scenario);
//
//         let ctx = test_scenario::ctx(&mut scenario);
//         numeron_map_system::register(&mut schema, 8, 3, ctx);
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//         numeron_map_system::move_position(&mut schema, &random, 3, ctx);
//
//         let encounter_info = schema.encounter()[ctx.sender()];
//         // Cannot move during an encounter
//         encounter_system::flee(&mut schema, ctx);
//
//         assert!(schema.encounter().contains(ctx.sender()) == false);
//         assert!(schema.monster().contains(encounter_info.get_monster_id()) == false);
//
//         test_scenario::return_shared(random);
//         test_scenario::return_shared(schema);
//         dapp.distroy_dapp_for_testing();
//         scenario.end();
//     }
// }