#[test_only]
module numeron::monster_test {
    use numeron::numeron_schema::Schema;
    use numeron::numeron_position;
    use sui::random::Random;
    use sui::random;
    use sui::test_scenario;
    use numeron::numeron_map_system;
    use numeron::numeron_monster_system;
    use numeron::numeron_init_test;
    use numeron::numeron_encounter_info;
    use numeron::numeron_monster_type;

    #[test]
    fun claim(){
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);

        let ctx = test_scenario::ctx(&mut scenario);
        numeron_map_system::register(&mut dubhe_schema, &mut schema, 0, 0, 0, ctx);


        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);

        assert!(schema.next_monster_id()[] == 3);
        assert!(schema.monster_owned_by()[@0xA] == vector[0, 1, 2]);

        test_scenario::return_shared(dubhe_schema);
        test_scenario::return_shared(schema);
        scenario.end();
    }

    #[test]
    fun select(){
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);


        let ctx = test_scenario::ctx(&mut scenario);
        numeron_map_system::register(&mut dubhe_schema, &mut schema, 0, 0, 0, ctx);

        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);

        numeron_monster_system::select_monster(&mut dubhe_schema, &mut schema, 0, 1,ctx);
        assert!(schema.monster_owned_by()[@0xA] == vector[1, 0, 2]);

        numeron_monster_system::select_monster(&mut dubhe_schema, &mut schema, 1, 2,ctx);
        assert!(schema.monster_owned_by()[@0xA] == vector[1, 2, 0]);

        numeron_monster_system::select_monster(&mut dubhe_schema, &mut schema, 2, 1,ctx);
        assert!(schema.monster_owned_by()[@0xA] == vector[1, 0, 2]);
        
        test_scenario::return_shared(dubhe_schema);
        test_scenario::return_shared(schema);
        scenario.end();
        
    }

    #[test]
    fun release(){
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);


        let ctx = test_scenario::ctx(&mut scenario);
        numeron_map_system::register(&mut dubhe_schema, &mut schema, 0, 0, 0, ctx);

        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);
        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);

        numeron_monster_system::release_monster(&mut dubhe_schema, &mut schema, 0, ctx);
        
        assert!(schema.monster_owned_by()[@0xA] == vector[1, 2]);

        numeron_monster_system::release_monster(&mut dubhe_schema, &mut schema, 1, ctx);
        assert!(schema.monster_owned_by()[@0xA] == vector[2]);

        test_scenario::return_shared(dubhe_schema);
        test_scenario::return_shared(schema);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = numeron::numeron_errors::ATLEAST_ONE_MONSTER)]
    fun release_should_fail(){
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        let (mut dubhe_schema, mut schema) = numeron_init_test::deploy_dapp_for_testing(&mut scenario);


        let ctx = test_scenario::ctx(&mut scenario);
        numeron_map_system::register(&mut dubhe_schema, &mut schema, 0, 0, 0, ctx);

        numeron_monster_system::claim_monster(&mut dubhe_schema, &mut schema, ctx);

        numeron_monster_system::release_monster(&mut dubhe_schema, &mut schema, 0, ctx);

        test_scenario::return_shared(dubhe_schema);
        test_scenario::return_shared(schema);
        scenario.end();
    }

}