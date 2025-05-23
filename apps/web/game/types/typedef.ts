import { AttackKeys } from '../battle/attacks/attack-keys';
import { Direction } from '../common/direction';

export interface BattleMonsterConfig {
  scene: Phaser.Scene;
  monsterDetails: Monster;
  scaleHealthBarBackgroundImageByY?: number;
  skipBattleAnimations?: boolean;
}

export interface Monster {
  id: string;
  monsterId: number;
  name: string;
  assetKey: string;
  assetFrame?: number;
  currentLevel: number;
  maxHp: number;
  currentHp: number;
  baseAttack: number;
  attackIds: number[];
  currentAttack: number;
  baseExp: number;
  currentExp: number;
}

export interface Coordinate {
  x: number;
  y: number;
}

export interface Attack {
  id: number;
  name: string;
  animationName: AttackKeys;
  audioKey: string;
}

export interface Animation {
  key: string;
  frames?: number[];
  frameRate: number;
  repeat: number;
  delay: number;
  yoyo: boolean;
  assetKey: string;
}

export const ITEM_CATEGORY = Object.freeze({
  HEAL: 'HEAL',
  CAPTURE: 'CAPTURE',
  Currency: 'Currency',
  Medicine: 'Medicine',
  Scroll: 'Scroll',
  Ball: 'Ball',
  TreasureChest: 'TreasureChest',
} as const);

export type ItemCategory = keyof typeof ITEM_CATEGORY;

export const ITEM_EFFECT = Object.freeze({
  HEAL_30: 'HEAL_30',
  CAPTURE_1: 'CAPTURE_1',
  DEFAULT: 'DEFAULT',
} as const);

export type ItemEffect = keyof typeof ITEM_EFFECT;

export interface Item {
  id: number;
  name: string;
  effect: ItemEffect;
  description: string;
  category: ItemCategory;
  isTransferable: boolean;
}

export interface BaseInventoryItem {
  item: {
    id: number;
  };
  quantity: number;
}

export type Inventory = BaseInventoryItem[];

export interface InventoryItem {
  item: Item;
  quantity: number;
}

export type EncounterData = Record<string, number[][]>;

export const NPC_EVENT_TYPE = Object.freeze({
  MESSAGE: 'MESSAGE',
  SCENE_FADE_IN_AND_OUT: 'SCENE_FADE_IN_AND_OUT',
  HEAL: 'HEAL',
  TRADE: 'TRADE',
  ITEM: 'ITEM',
  BATTLE: 'BATTLE',
} as const);

export type NpcEventType = keyof typeof NPC_EVENT_TYPE;

export interface NpcEventMessage {
  type: 'MESSAGE';
  requires: string[];
  data: {
    messages: string[];
  };
}

export interface NpcEventSceneFadeInAndOut {
  type: 'SCENE_FADE_IN_AND_OUT';
  requires: string[];
  data: {
    fadeInDuration: number;
    fadeOutDuration: number;
    waitDuration: number;
  };
}

export interface NpcEventHeal {
  type: 'HEAL';
  requires: string[];
  data: Record<string, never>;
}

export type NpcEvent = NpcEventMessage | NpcEventSceneFadeInAndOut | NpcEventHeal;

export interface NpcDetails {
  frame: number;
  animationKeyPrefix: string;
  events: NpcEvent[];
}

export type NpcData = Record<string, NpcDetails>;

export const GAME_EVENT_TYPE = Object.freeze({
  ADD_NPC: 'ADD_NPC',
  MOVE_TO_PLAYER: 'MOVE_TO_PLAYER',
  RETRACE_PATH: 'RETRACE_PATH',
  TALK_TO_PLAYER: 'TALK_TO_PLAYER',
  REMOVE_NPC: 'REMOVE_NPC',
  GIVE_MONSTER: 'GIVE_MONSTER',
  ADD_FLAG: 'ADD_FLAG',
  REMOVE_FLAG: 'REMOVE_FLAG',
} as const);

export type GameEventType = keyof typeof GAME_EVENT_TYPE;

export interface GameEventAddNpc {
  type: 'ADD_NPC';
  data: {
    direction: Direction;
    x: number;
    y: number;
    frame: number;
    id: number;
    animationKeyPrefix: string;
  };
}

export interface GameEventMoveToPlayer {
  type: 'MOVE_TO_PLAYER';
  data: {
    id: number;
  };
}

export interface GameEventRetracePath {
  type: 'RETRACE_PATH';
  data: {
    id: number;
    direction: Direction;
  };
}

export interface GameEventTalkToPlayer {
  type: 'TALK_TO_PLAYER';
  data: {
    id: number;
    messages: string[];
  };
}

export interface GameEventRemoveNpc {
  type: 'REMOVE_NPC';
  data: {
    id: number;
  };
}

export interface GameEventGiveMonster {
  type: 'GIVE_MONSTER';
  data: {
    id: number;
  };
}

export interface GameEventAddFlag {
  type: 'ADD_FLAG';
  data: {
    flag: GameFlag;
  };
}

export interface GameEventRemoveFlag {
  type: 'REMOVE_FLAG';
  data: {
    flag: GameFlag;
  };
}

export type GameEvent =
  | GameEventAddNpc
  | GameEventMoveToPlayer
  | GameEventRetracePath
  | GameEventRemoveNpc
  | GameEventTalkToPlayer
  | GameEventGiveMonster
  | GameEventAddFlag
  | GameEventRemoveFlag;

export interface EventDetails {
  requires: string[];
  events: GameEvent[];
}

export type EventData = Record<string, EventDetails>;

export const GAME_FLAG = Object.freeze({
  HAS_MONSTER: 'HAS_MONSTER',
  LOOKING_FOR_PROFESSOR: 'LOOKING_FOR_PROFESSOR',
  FOUND_PROFESSOR: 'FOUND_PROFESSOR',
} as const);

export type GameFlag = keyof typeof GAME_FLAG;

export const ENCOUNTER_TILE_TYPE = Object.freeze({
  NONE: 'NONE',
  GRASS: 'GRASS',
} as const);

export type EncounterTileType = keyof typeof ENCOUNTER_TILE_TYPE;

export const MAP_ID_TYPE = {
  main_1: '0',
  building_1: '1',
  building_2: '2',
} as const;

export const LOCATION_TYPE = {
  0: {
    area: 'main_1',
    isInterior: false,
  },
  1: {
    area: 'building_1',
    isInterior: true,
  },
  2: {
    area: 'building_2',
    isInterior: true,
  },
} as const;

export type LocationType = keyof typeof LOCATION_TYPE;
