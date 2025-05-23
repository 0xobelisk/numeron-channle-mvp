import { atom } from 'jotai';
import { SuiMoveNormalizedModules } from '@0xobelisk/sui-client';

export type TerrainItemType = {
  None?: boolean;
  TallGrass?: boolean;
  Boulder?: boolean;
  $kind: 'None' | 'TallGrass' | 'Boulder';
};

export type MapDataType = {
  map: TerrainItemType[][];
  type: string;
  ele_description: Record<string, TerrainItemType[]>;
  events: {
    x: number;
    y: number;
  }[];
  map_type: string;
};

export type LogType = {
  display: boolean;
  content: string;
  yesContent: string;
  noContent: string;
  onYes?: Function;
  onNo?: Function;
};

export type HeroType = {
  name: string;
  position: {
    left: number;
    top: number;
  };
  lock: boolean;
};

export type MonsterType = {
  exist: boolean;
};

export type OwnedMonsterType = string[];

export type AccountType = {
  address: string;
  connected: boolean;
  loggedIn: boolean;
};

export type PlayerType = {
  address: string;
  position: {
    left: number;
    top: number;
  };
};

const MapData = atom<MapDataType>({
  map: [],
  type: 'green',
  ele_description: {
    walkable: [
      {
        None: true,
        $kind: 'None',
      },
      {
        TallGrass: true,
        $kind: 'TallGrass',
      },
    ],
    green: [
      {
        None: true,
        $kind: 'None',
      },
    ],
    tussock: [
      {
        TallGrass: true,
        $kind: 'TallGrass',
      },
    ],
    small_tree: [
      {
        Boulder: true,
        $kind: 'Boulder',
      },
    ],
  },
  events: [],
  map_type: 'event',
});

const ContractMetadata = atom<SuiMoveNormalizedModules>({});

const SendTxLog = atom<LogType>({
  display: false,
  content: '',
  yesContent: '',
  noContent: '',
  onYes: null,
  onNo: null,
});

const Dialog = atom<LogType>({
  display: false,
  content: '',
  yesContent: '',
  noContent: '',
  onYes: null,
  onNo: null,
});

const Hero = atom<HeroType>({
  name: '',
  position: { left: 0, top: 0 },
  lock: false,
});

const Monster = atom({
  exist: false,
});

const OwnedMonster = atom([]);

const Account = atom({
  address: '',
  connected: false,
  loggedIn: false,
});

const AllPlayers = atom<PlayerType[]>([]);

const MapMetaData = atom({
  schema_id: '',
  package_id: '',
});

export { MapData, ContractMetadata, SendTxLog, Dialog, Hero, Monster, OwnedMonster, Account, AllPlayers, MapMetaData };
