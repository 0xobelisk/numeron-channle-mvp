import { UI_ASSET_KEYS } from '../../assets/asset-keys';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys';
import { DIRECTION, Direction } from '../direction';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../../utils/data-manager';
import { exhaustiveGuard } from '../../utils/guard';
import { MENU_COLOR } from './menu-config';
import { MenuColorOptions } from '../../common/options';

const MENU_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#FFFFFF',
  fontSize: '32px',
};

export class Menu {
  #scene: Phaser.Scene;
  #padding: number;
  #width: number;
  #height: number;
  #graphics: Phaser.GameObjects.Graphics;
  #container: Phaser.GameObjects.Container;
  #isVisible: boolean;
  #availableMenuOptions: string[];
  #menuOptionsTextGameObjects: Phaser.GameObjects.Text[];
  #selectedMenuOptionIndex: number;
  #selectedMenuOption: string;
  #userInputCursor: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, menuOptions: string[]) {
    this.#scene = scene;
    this.#padding = 4;
    this.#width = 300;
    this.#availableMenuOptions = menuOptions;
    this.#menuOptionsTextGameObjects = [];
    this.#selectedMenuOptionIndex = 0;

    // calculate height based on currently available options
    this.#height = 10 + this.#padding * 2 + this.#availableMenuOptions.length * 50;

    this.#graphics = this.#createGraphics();
    this.#container = this.#scene.add.container(0, 0, [this.#graphics]);

    // update menu container with menu options
    for (let i = 0; i < this.#availableMenuOptions.length; i += 1) {
      const y = 10 + 50 * i + this.#padding;
      const textObj = this.#scene.add.text(40 + this.#padding, y, this.#availableMenuOptions[i], MENU_TEXT_STYLE);
      this.#menuOptionsTextGameObjects.push(textObj);
      this.#container.add(textObj);
    }

    // add player input cursor
    this.#userInputCursor = this.#scene.add.image(20 + this.#padding, 28 + this.#padding, UI_ASSET_KEYS.CURSOR_WHITE);
    this.#userInputCursor.setScale(2.5);
    this.#container.add(this.#userInputCursor);

    this.hide();
  }

  get isVisible(): boolean {
    return this.#isVisible;
  }

  get selectedMenuOption(): string {
    return this.#selectedMenuOption;
  }

  show() {
    const { right, top } = this.#scene.cameras.main.worldView;
    const startX = right - this.#padding * 2 - this.#width;
    const startY = top + this.#padding * 2;

    this.#container.setPosition(startX, startY);
    this.#container.setAlpha(1);
    this.#isVisible = true;
  }

  hide() {
    this.#container.setAlpha(0);
    this.#selectedMenuOptionIndex = 0;
    this.#moveMenuCursor(DIRECTION.NONE);
    this.#isVisible = false;
  }

  handlePlayerInput(input: Direction | 'OK' | 'CANCEL') {
    if (input === 'CANCEL') {
      this.hide();
      return;
    }

    if (input === 'OK') {
      this.#handleSelectedMenuOption();
      return;
    }

    // update selected menu option based on player input
    this.#moveMenuCursor(input);
  }

  /**
   * @returns {Phaser.GameObjects.Graphics}
   */
  #createGraphics() {
    const g = this.#scene.add.graphics();
    const menuColor = this.#getMenuColorsFromDataManager();

    g.fillStyle(menuColor.main, 1);
    g.fillRect(1, 0, this.#width - 1, this.#height - 1);
    g.lineStyle(8, menuColor.border, 1);
    g.strokeRect(0, 0, this.#width, this.#height);
    g.setAlpha(0.9);

    return g;
  }

  #moveMenuCursor(direction: Direction) {
    switch (direction) {
      case DIRECTION.UP:
        this.#selectedMenuOptionIndex -= 1;
        if (this.#selectedMenuOptionIndex < 0) {
          this.#selectedMenuOptionIndex = this.#availableMenuOptions.length - 1;
        }
        break;
      case DIRECTION.DOWN:
        this.#selectedMenuOptionIndex += 1;
        if (this.#selectedMenuOptionIndex > this.#availableMenuOptions.length - 1) {
          this.#selectedMenuOptionIndex = 0;
        }
        break;
      case DIRECTION.LEFT:
      case DIRECTION.RIGHT:
        return;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }
    const x = 20 + this.#padding;
    const y = 28 + this.#padding + this.#selectedMenuOptionIndex * 50;

    this.#userInputCursor.setPosition(x, y);
  }

  #handleSelectedMenuOption() {
    this.#selectedMenuOption = this.#availableMenuOptions[this.#selectedMenuOptionIndex];
  }

  #getMenuColorsFromDataManager(): { main: number; border: number } {
    const chosenMenuColor: MenuColorOptions = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_MENU_COLOR);
    if (chosenMenuColor === undefined) {
      return MENU_COLOR[1];
    }

    switch (chosenMenuColor) {
      case 0:
        return MENU_COLOR[1];
      case 1:
        return MENU_COLOR[2];
      case 2:
        return MENU_COLOR[3];
      default:
        exhaustiveGuard(chosenMenuColor);
    }
  }
}
