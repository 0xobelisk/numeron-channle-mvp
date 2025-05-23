import { DIRECTION, Direction } from '../common/direction';

export class Controls {
  #scene: Phaser.Scene;
  #cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  #lockPlayerInput: boolean;
  #enterKey: Phaser.Input.Keyboard.Key | undefined;
  #fKey: Phaser.Input.Keyboard.Key | undefined;

  constructor(scene: Phaser.Scene) {
    this.#scene = scene;
    this.#cursorKeys = this.#scene.input.keyboard?.createCursorKeys();
    this.#enterKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.#fKey = this.#scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.#lockPlayerInput = false;
  }

  get isInputLocked(): boolean {
    return this.#lockPlayerInput;
  }

  set lockInput(val: boolean) {
    this.#lockPlayerInput = val;
  }

  wasEnterKeyPressed(): boolean {
    if (this.#enterKey === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#enterKey);
  }

  wasSpaceKeyPressed(): boolean {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.space);
  }

  wasBackKeyPressed(): boolean {
    if (this.#cursorKeys === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#cursorKeys.shift);
  }

  wasFKeyPressed(): boolean {
    if (this.#fKey === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#fKey);
  }

  getDirectionKeyJustPressed(): Direction {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    let selectedDirection: Direction = DIRECTION.NONE;
    if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.left)) {
      selectedDirection = DIRECTION.LEFT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.right)) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.up)) {
      selectedDirection = DIRECTION.UP;
    } else if (Phaser.Input.Keyboard.JustDown(this.#cursorKeys.down)) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }

  /** @returns {import('../common/direction').Direction} */
  getDirectionKeyPressedDown() {
    if (this.#cursorKeys === undefined) {
      return DIRECTION.NONE;
    }

    let selectedDirection: Direction = DIRECTION.NONE;
    if (this.#cursorKeys.left.isDown) {
      selectedDirection = DIRECTION.LEFT;
    } else if (this.#cursorKeys.right.isDown) {
      selectedDirection = DIRECTION.RIGHT;
    } else if (this.#cursorKeys.up.isDown) {
      selectedDirection = DIRECTION.UP;
    } else if (this.#cursorKeys.down.isDown) {
      selectedDirection = DIRECTION.DOWN;
    }

    return selectedDirection;
  }
}
