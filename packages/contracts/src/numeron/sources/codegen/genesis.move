#[allow(lint(share_owned))]module numeron::genesis {

  use sui::clock::Clock;

  use dubhe::dapp_service::DappHub;

  use numeron::dapp_key;

  use dubhe::dapp_system;

  use std::ascii::string;

  use numeron::tx_digest;

  use numeron::position;

  use numeron::item_dropped;

  public entry fun run(dapp_hub: &mut DappHub, clock: &Clock, ctx: &mut TxContext) {
    // Create Dapp
    let dapp_key = dapp_key::new();
    dapp_system::create_dapp(dapp_hub, dapp_key, string(b"numeron"), string(b"numeron contract"), clock, ctx);
    // Register tables
    tx_digest::register_table(dapp_hub, ctx);
    position::register_table(dapp_hub, ctx);
    item_dropped::register_table(dapp_hub, ctx);
    // Logic that needs to be automated once the contract is deployed
    numeron::deploy_hook::run(dapp_hub, ctx);
  }

  public(package) fun upgrade(dapp_hub: &mut DappHub, new_package_id: address, new_version: u32, ctx: &mut TxContext) {
    // Upgrade Dapp
    let dapp_key = dapp_key::new();
    dapp_system::upgrade_dapp(dapp_hub, dapp_key, new_package_id, new_version, ctx);
    // Register new tables
    // ==========================================
    // ==========================================
  }
}
