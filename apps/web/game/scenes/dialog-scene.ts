import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys';
import { SCENE_KEYS } from './scene-keys';
import { BaseScene } from './base-scene';
import { CANNOT_READ_SIGN_TEXT, animateText } from '../utils/text-utils';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager';
import { UI_ASSET_KEYS } from '../assets/asset-keys';
import { MENU_COLOR } from '../config';
import { exhaustiveGuard } from '../utils/guard';
import { MenuColorOptions } from '../common/options';

const UI_TEXT_STYLE = Object.freeze({
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: 'white',
  fontSize: '32px',
  wordWrap: { width: 0 },
});

export class DialogScene extends BaseScene {
  #padding: number;
  #width: number;
  #height: number;
  #container: Phaser.GameObjects.Container;
  #isVisible: boolean;
  #userInputCursor: Phaser.GameObjects.Image;
  #userInputCursorTween: Phaser.Tweens.Tween;
  #uiText: Phaser.GameObjects.Text;
  #textAnimationPlaying: boolean;
  #messagesToShow: string[];

  constructor() {
    super({
      key: SCENE_KEYS.DIALOG_SCENE,
    });
  }

  get isVisible(): boolean {
    return this.#isVisible;
  }

  get isAnimationPlaying(): boolean {
    return this.#textAnimationPlaying;
  }

  get moreMessagesToShow(): boolean {
    return this.#messagesToShow.length > 0;
  }

  async create() {
    this.#padding = 90;
    this.#width = 1280 - this.#padding * 2;
    this.#height = 124;
    this.#textAnimationPlaying = false;
    this.#messagesToShow = [];
    this.cameras.main.setZoom(0.8);

    const menuColor = this.#getMenuColorsFromDataManager();
    const panel = this.add
      .rectangle(0, 0, this.#width, this.#height, menuColor.main, 0.9)
      .setOrigin(0)
      .setStrokeStyle(8, menuColor.border, 1);
    this.#container = this.add.container(0, 0, [panel]);
    this.#uiText = this.add.text(18, 12, '', {
      ...UI_TEXT_STYLE,
      ...{ wordWrap: { width: this.#width - 18 } },
    });
    this.#container.add(this.#uiText);
    this.#createPlayerInputCursor();
    this.hideDialogModal();
    this.scene.bringToTop();
  }

  showDialogModal(messages: string[]) {
    this.#messagesToShow = [...messages];

    const { x, bottom } = this.cameras.main.worldView;
    const startX = x + this.#padding;
    const startY = bottom - this.#height - this.#padding / 4;

    this.#container.setPosition(startX, startY);
    this.#userInputCursorTween.restart();
    this.#container.setAlpha(1);
    this.#isVisible = true;

    this.showNextMessage();
  }

  showNextMessage() {
    if (this.#messagesToShow.length === 0) {
      return;
    }

    this.#uiText.setText('').setAlpha(1);
    animateText(this, this.#uiText, this.#messagesToShow.shift(), {
      delay: dataManager.getAnimatedTextSpeed(),
      callback: () => {
        this.#textAnimationPlaying = false;
      },
    });
    this.#textAnimationPlaying = true;
  }

  hideDialogModal() {
    this.#container.setAlpha(0);
    this.#userInputCursorTween.pause();
    this.#isVisible = false;
  }

  #createPlayerInputCursor() {
    const y = this.#height - 24;
    this.#userInputCursor = this.add.image(this.#width - 16, y, UI_ASSET_KEYS.CURSOR);
    this.#userInputCursor.setAngle(90).setScale(4.5, 2);

    this.#userInputCursorTween = this.add.tween({
      delay: 0,
      duration: 500,
      repeat: -1,
      y: {
        from: y,
        start: y,
        to: y + 6,
      },
      targets: this.#userInputCursor,
    });
    this.#userInputCursorTween.pause();
    this.#container.add(this.#userInputCursor);
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
