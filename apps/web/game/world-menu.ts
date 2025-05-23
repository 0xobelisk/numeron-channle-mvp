import { Menu } from './common/menu/menu';

export const MENU_OPTIONS = Object.freeze({
  MONSTERDEX: 'MONSTERDEX',
  MONSTERS: 'MONSTERS',
  BAG: 'BAG',
  SAVE: 'SAVE',
  OPTIONS: 'OPTIONS',
  EXIT: 'EXIT',
});

export type MenuOptions = keyof typeof MENU_OPTIONS;

export class WorldMenu extends Menu {
  constructor(scene: Phaser.Scene) {
    super(scene, [MENU_OPTIONS.MONSTERS, MENU_OPTIONS.BAG, MENU_OPTIONS.SAVE, MENU_OPTIONS.EXIT]);
  }
}
