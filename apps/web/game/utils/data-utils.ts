import { DATA_ASSET_KEYS } from '../assets/asset-keys';
import {
  Attack,
  Animation,
  Item,
  Monster,
  EncounterData,
  NpcDetails,
  NpcData,
  EventDetails,
  EventData,
} from '../types/typedef';

export class DataUtils {
  static getMonsterAttack(scene: Phaser.Scene, attackId: number): Attack | undefined {
    const data: Attack[] = scene.cache.json.get(DATA_ASSET_KEYS.ATTACKS);
    return data.find(attack => attack.id === attackId);
  }

  static getAnimations(scene: Phaser.Scene): Animation[] {
    const data: Animation[] = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
    return data;
  }

  // static getItem(scene: Phaser.Scene, itemId: number): Item | undefined {
  //   const data: Item[] = scene.cache.json.get(DATA_ASSET_KEYS.ITEMS);
  //   return data.find(item => item.id === itemId);
  // }

  // static getItems(scene: Phaser.Scene, itemIds: number[]): Item[] | undefined {
  //   const data: Item[] = scene.cache.json.get(DATA_ASSET_KEYS.ITEMS);
  //   return data.filter(item => {
  //     return itemIds.some(id => id === item.id);
  //   });
  // }

  /**
   * Utility function for retrieving a Monster object from the monsters.json data file.
   */
  static getMonsterById(scene: Phaser.Scene, monsterId: number): Monster {
    const data: Monster[] = scene.cache.json.get(DATA_ASSET_KEYS.MONSTERS);
    return data.find(monster => monster.monsterId === monsterId);
  }

  static getEncounterAreaDetails(scene: Phaser.Scene, areaId: number): number[][] {
    const data: EncounterData = scene.cache.json.get(DATA_ASSET_KEYS.ENCOUNTERS);
    return data[areaId];
  }

  static getNpcData(scene: Phaser.Scene, npcId: number): NpcDetails {
    const data: NpcData = scene.cache.json.get(DATA_ASSET_KEYS.NPCS);
    return data[npcId];
  }

  static getEventData(scene: Phaser.Scene, eventId: number): EventDetails {
    const data: EventData = scene.cache.json.get(DATA_ASSET_KEYS.EVENTS);
    return data[eventId];
  }
}
