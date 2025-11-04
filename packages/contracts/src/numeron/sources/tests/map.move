#[test_only]
module numeron::map_test;
use sui::test_scenario;
use numeron::map_system;
use numeron::init_test;
use std::ascii::string;
use std::address;
use dubhe::address_system;

#[test]
fun move_position_should_work(){
        let sui_player = @0xc84ba871346dc957269d05b389df50e56ab0f57b466d1084edf734a323993b47;
        let evm_player = b"0xcdd077770ceb5271e42289ee1a9b3a19442f445d";
        let solana_player = b"3vy8k1NAc3Q9EPvqrAuS4DG4qwbgVqfxznEdtcrL743L";
        let mut scenario  = test_scenario::begin(sui_player);
        let mut dapp_hub = init_test::deploy_dapp_for_testing(&mut scenario);

        {
           let ctx = test_scenario::ctx(&mut scenario);
           map_system::move_position(&mut dapp_hub, 1, ctx);
        };

        address_system::setup_evm_scenario(&mut scenario, evm_player);
        {
           let ctx = test_scenario::ctx(&mut scenario);
           map_system::move_position(&mut dapp_hub, 1, ctx);
        };

        address_system::setup_solana_scenario(&mut scenario, solana_player);
        {
           let ctx = test_scenario::ctx(&mut scenario);
           map_system::move_position(&mut dapp_hub, 1, ctx);
        };




        dapp_hub.destroy();
        scenario.end();
}