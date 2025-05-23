module numeron::market_system;

use numeron::numeron_schema::Schema;
use numeron::numeron_item::Item;
use numeron::numeron_item;
use numeron::numeron_item_system;
use numeron::numeron_swap_order;
use numeron::numeron_trade_order;
use numeron::numeron_dapp_key;
use numeron::numeron_dapp_key::DappKey;
use sui::clock::Clock;
use sui::clock;
use dubhe::dubhe_schema::Schema as DubheSchema;
use numeron::numeron_errors::{invalid_item_parameters_error, order_not_found_error, not_your_order_error, order_expired_error, invalid_key_amount_error};

public entry fun create_swap_order(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_ids: vector<u256>, item_quantities: vector<u256>, expected_item_ids: vector<u256>, expected_item_quantities: vector<u256>,  clock: &Clock, period: u64,  ctx: &TxContext) {
    let dapp_key = numeron_dapp_key::new();
    invalid_item_parameters_error(
      item_ids.length() == item_quantities.length()
      && expected_item_ids.length() == expected_item_quantities.length()
      && item_ids.length() > 0
      && expected_item_ids.length() > 0
      && period > 0,
      );
    let creator = ctx.sender();
    let order_id = schema.next_order_id()[];
    let created_at = clock.timestamp_ms();
    let expired_at = created_at + period;
    let mut items = vector[];
    let mut expected_items = vector[];
    let mut i = 0;
    while (i < item_ids.length()) {
        numeron_item_system::burn(
            dubhe_schema, 
            schema, 
            item_ids[i], 
            creator, 
            item_quantities[i]
        );
        items.push_back(numeron_item::new(item_ids[i], item_quantities[i]));
        i = i + 1;
    };
    let mut j = 0;
    while (j < expected_item_ids.length()) {
        expected_items.push_back(numeron_item::new(expected_item_ids[j], expected_item_quantities[j]));
        j = j + 1;
    };
    schema.swap_order().set(
        dubhe_schema, 
        dapp_key, 
        order_id, 
        numeron_swap_order::new(
            order_id,
            creator,
            items,
            expected_items,
            created_at,
            expired_at
    ));
    schema.next_order_id().set(
        dubhe_schema, 
        dapp_key, 
        order_id + 1
    );
}

public entry fun create_trade_order(dubhe_schema: &mut DubheSchema, schema: &mut Schema, item_ids: vector<u256>, item_quantities: vector<u256>, price: u256, clock: &Clock, period: u64,  ctx: &TxContext) {
    let dapp_key = numeron_dapp_key::new();
    invalid_item_parameters_error(
      item_ids.length() == item_quantities.length()
      && item_ids.length() > 0
      && price > 0
      && period > 0,
      );
    let creator = ctx.sender();
    let order_id = schema.next_order_id()[];
    let created_at = clock.timestamp_ms();
    let expired_at = created_at + period;
    let mut items = vector[];
    let mut i = 0;
    while (i < item_ids.length()) {
        numeron_item_system::burn(
            dubhe_schema, 
            schema, 
            item_ids[i], 
            creator, 
            item_quantities[i]
        );
        items.push_back(numeron_item::new(item_ids[i], item_quantities[i]));
        i = i + 1;
    };  
    schema.trade_order().set(
        dubhe_schema, 
        dapp_key, 
        order_id, 
        numeron_trade_order::new(
            order_id,
            creator,
            items,
            price,
            created_at,
            expired_at
    )); 
    schema.next_order_id().set(
        dubhe_schema, 
        dapp_key, 
        order_id + 1
    );
}

public entry fun cancel_order(dubhe_schema: &mut DubheSchema, schema: &mut Schema, order_id: u256, ctx: &TxContext) {
    let creator = ctx.sender();
    if (schema.swap_order().contains(order_id)) { 
        let order = schema.swap_order()[order_id];
        let mut i = 0;
        while (i < order.get_items().length()) {
            numeron_item_system::mint(
                dubhe_schema, 
                schema, 
                order.get_items()[i].get_id(), 
                creator, 
                order.get_items()[i].get_quantities()
            );
            i = i + 1;
        };
        schema.swap_order().remove(order_id);
    } else if (schema.trade_order().contains(order_id)) {
        let order = schema.trade_order()[order_id];
        let mut i = 0;
        while (i < order.get_items().length()) {
            numeron_item_system::mint(
                dubhe_schema, 
                schema, 
                order.get_items()[i].get_id(), 
                creator, 
                order.get_items()[i].get_quantities()
            );
            i = i + 1;
        };
        schema.trade_order().remove(order_id);
    } else {
        order_not_found_error(false);
    }
}

public entry fun claim_order(dubhe_schema: &mut DubheSchema, schema: &mut Schema, order_id: u256, clock: &Clock, ctx: &TxContext) {
    let buyer = ctx.sender();
    if (schema.trade_order().contains(order_id)) { 
        let order = schema.trade_order()[order_id]; 
        order_expired_error(order.get_expired_at() > clock.timestamp_ms());

        let asset_id = schema.num_asset_id()[];

        let package_id = dubhe::type_info::get_package_id<DappKey>();
        let fee_receiver = dubhe_schema.borrow_dapp_admin()[package_id];
        let fee = order.get_price() * schema.order_fee_rate()[] / 10000;

        dubhe::dubhe_assets_system::transfer_asset(
            dubhe_schema, 
            numeron_dapp_key::new(), 
            asset_id, 
            buyer, 
            fee_receiver, 
            fee
        );

        dubhe::dubhe_assets_system::transfer_asset(
            dubhe_schema, 
            numeron_dapp_key::new(), 
            asset_id, 
            buyer, 
            order.get_creator(), 
            order.get_price() - fee
        );

        let mut i = 0;
        while (i < order.get_items().length()) {
            numeron_item_system::mint(
                dubhe_schema, 
                schema, 
                order.get_items()[i].get_id(), 
                buyer, 
                order.get_items()[i].get_quantities()
            );
            i = i + 1;
        };
        schema.trade_order().remove(order_id);
    } else if (schema.swap_order().contains(order_id)) { 
        let order = schema.swap_order()[order_id];
        order_expired_error(order.get_expired_at() > clock.timestamp_ms());
        let mut i = 0;
        while (i < order.get_expected_items().length()) {
          numeron_item_system::burn(
                dubhe_schema, 
                schema, 
                order.get_expected_items()[i].get_id(), 
                buyer, 
                order.get_expected_items()[i].get_quantities()
            );
            numeron_item_system::mint(
                dubhe_schema, 
                schema, 
                order.get_expected_items()[i].get_id(), order.get_creator(), order.get_expected_items()[i].get_quantities());
          i = i + 1;
       };

    let mut j = 0;
    while (j < order.get_items().length()) {
        numeron_item_system::mint(
            dubhe_schema, 
            schema, 
            order.get_items()[j].get_id(), 
            buyer, 
            order.get_items()[j].get_quantities()
        );
        j = j + 1;
    };
    schema.swap_order().remove(order_id);
    } else {
        order_not_found_error(false);
    }
}

public entry fun buy_key(dubhe_schema: &mut DubheSchema, schema: &mut Schema, amount: u256, ctx: &mut TxContext) {
    let dapp_key = numeron_dapp_key::new();
    invalid_key_amount_error(amount > 0);
    let buyer = ctx.sender();
    let key_price = schema.key_price()[];
    let package_id = dubhe::type_info::get_package_id<DappKey>();
    let fee_receiver = dubhe_schema.borrow_dapp_admin()[package_id];
    let num_asset_id = schema.num_asset_id()[];
    dubhe::dubhe_assets_system::transfer_asset(
        dubhe_schema, 
        dapp_key, 
        num_asset_id, 
        buyer, 
        fee_receiver, 
        key_price * amount
    );
    numeron_item_system::mint(
        dubhe_schema, 
        schema, 
        11, 
        buyer, 
        amount
    );
}
