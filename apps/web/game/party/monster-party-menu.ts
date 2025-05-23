import { Menu } from '../common/menu/menu';
import { SCENE_KEYS } from '../scenes/scene-keys';

export const MONSTER_PARTY_MENU_OPTIONS = Object.freeze({
  SELECT: 'SELECT',
  MOVE: 'MOVE',
  SUMMARY: 'SUMMARY',
  RELEASE: 'RELEASE',
  CANCEL: 'CANCEL',
});

type MonsterPartyMenuOptions = keyof typeof MONSTER_PARTY_MENU_OPTIONS;

export class MonsterPartyMenu extends Menu {
  constructor(scene: Phaser.Scene, previousSceneName: string) {
    const availableOptions: MonsterPartyMenuOptions[] = [
      MONSTER_PARTY_MENU_OPTIONS.SELECT,
      MONSTER_PARTY_MENU_OPTIONS.SUMMARY,
      MONSTER_PARTY_MENU_OPTIONS.CANCEL,
    ];
    if (previousSceneName === SCENE_KEYS.WORLD_SCENE) {
      availableOptions.splice(0, 1, MONSTER_PARTY_MENU_OPTIONS.MOVE);
      availableOptions.splice(2, 0, MONSTER_PARTY_MENU_OPTIONS.RELEASE);
    }
    super(scene, availableOptions);
  }
}
