#[test_only]
module numeron::map_test;
use numeron::numeron_schema::Schema;
use numeron::numeron_position;
use sui::random::Random;
use sui::random;
use sui::test_scenario;
use numeron::numeron_init_test;
use numeron::numeron_encounter_info;
use numeron::numeron_monster_type;
use numeron::numeron_map_system;
#[test]
fun register(){
    let sender = @0xA;
    let mut scenario = test_scenario::begin(sender);
    let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);
    let ctx = test_scenario::ctx(&mut scenario);

    test_scenario::return_shared(schema);
    test_scenario::return_shared(dubhe_schema);
    scenario.end();
}

#[test]
fun move_position_should_work(){
    let sender = @0x0;
    let mut scenario = test_scenario::begin(sender);
    let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);
    {
        random::create_for_testing(scenario.ctx());
        scenario.next_tx(@0xA);
    };
    let random = test_scenario::take_shared<Random>(&scenario);

    let ctx = test_scenario::ctx(&mut scenario);
    numeron_map_system::register(&mut dubhe_schema, &mut schema, 0, 0, 0, ctx);

    numeron_map_system::move_position(&mut dubhe_schema, &mut schema, &random, 1, ctx);
    numeron_map_system::move_position(&mut dubhe_schema, &mut schema, &random, 1, ctx);
    // assert!(schema.position()[ctx.sender()] == numeron_position::new(8, 4));
    // assert!(schema.balance()[ctx.sender()] == 1);
    //
    // numeron_map_system::move_position(&mut schema, &random, 1, ctx);
    // assert!(schema.position()[ctx.sender()] == numeron_position::new(8, 5));
    // assert!(schema.balance()[ctx.sender()] == 2);

    // 23140719614837502849299678247283568217
    // 265323129722700274815559996314403104838
    // 167645769845140257622894197850400210971
    // 337352614844298231097611607824428697695
    // 143043683458825263308720013747056599257
    // 97853292883519077516783190366887388411
    // 226059294092153697833364734032968362880

    // numeron_map_system::move_position(&mut schema, &random, 3, ctx);
    // numeron_map_system::move_position(&mut schema, &random, 3, ctx);
    // assert!(schema.balance()[ctx.sender()] == 2);
    // let expect_monster_id = 0;
    // let expect_monster_type = monster_type::new_rat();
    // assert!(schema.monster().get(expect_monster_id) == expect_monster_type);
    // assert!(schema.encounter().get(ctx.sender()) == numeron_encounter_info::new(expect_monster_id, 0));

    test_scenario::return_shared(schema);
    test_scenario::return_shared(dubhe_schema);
    test_scenario::return_shared(random);
    scenario.end();
}