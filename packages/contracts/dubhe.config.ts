import { DubheConfig } from '@0xobelisk/sui-common';

export const dubheConfig = {
  name: 'numeron',
  description: 'numeron contract',
  enums: {
    ItemType: ['Ball', 'Currency', 'Food', 'Medicine', 'Material', 'SkillBook', 'Scroll', 'TreasureChest'],
  },
  components: {},
  resources: {
    position: { 
      fields: {
        player: 'String',
        x: 'u64',
        y: 'u64',
      },
      keys: ['player'],
    },
    item_dropped: {
      offchain: true,
      fields: {
        player: 'String',
        item_type: 'ItemType',
      },
    },
  },
  errors: {
    not_registered: 'This player is not registered',
    invalid_direction: 'Invalid direction',
  },
} as DubheConfig;
