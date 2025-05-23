#[allow(lint(share_owned))]module numeron::numeron_genesis {

  use std::ascii::string;

  use sui::clock::Clock;

  use dubhe::dubhe_schema::Schema as DubheSchema;

  public entry fun run(_dubhe_schema: &mut DubheSchema, clock: &Clock, ctx: &mut TxContext) {
    // Create schemas
    let mut schema = numeron::numeron_schema::create(ctx);
    // Setup default storage
    dubhe::dubhe_dapp_system::create_dapp(
      _dubhe_schema, 
      numeron::numeron_dapp_key::new(), 
      dubhe::dubhe_dapp_metadata::new(string(b"numeron"), string(b"numeron contract"), vector[], string(b""), clock.timestamp_ms(), vector[]), 
      ctx
    );
    // Logic that needs to be automated once the contract is deployed
    numeron::numeron_deploy_hook::run(_dubhe_schema,&mut schema, ctx);
    // Authorize schemas and public share objects
    sui::transfer::public_share_object(schema);
  }
}
