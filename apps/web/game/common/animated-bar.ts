export interface AnimatedBarConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  scaleY?: number; // default: 0.7
  leftCapAssetKey: string;
  middleAssetKey: string;
  rightCapAssetKey: string;
  leftShadowCapAssetKey: string;
  middleShadowAssetKey: string;
  rightShadowCapAssetKey: string;
}

export class AnimatedBar {
  _scene: Phaser.Scene;
  _container: Phaser.GameObjects.Container;
  _fullWidth: number;
  _scaleY: number;
  _leftCap: Phaser.GameObjects.Image;
  _middle: Phaser.GameObjects.Image;
  _rightCap: Phaser.GameObjects.Image;
  _leftShadowCap: Phaser.GameObjects.Image;
  _middleShadow: Phaser.GameObjects.Image;
  _rightShadowCap: Phaser.GameObjects.Image;
  _config: AnimatedBarConfig;

  constructor(config: AnimatedBarConfig) {
    if (this.constructor === AnimatedBar) {
      throw new Error('AnimatedBar is an abstract class and cannot be instantiated.');
    }

    this._scene = config.scene;
    this._fullWidth = config.width;
    this._scaleY = config.scaleY;
    this._config = config;

    this._container = this._scene.add.container(config.x, config.y, []);
    this._createBarShadowImages(config.x, config.y);
    this._createBarImages(config.x, config.y);
    this._setMeterPercentage(1);
  }

  get container(): Phaser.GameObjects.Container {
    return this._container;
  }

  _createBarShadowImages(x: number, y: number) {
    this._leftShadowCap = this._scene.add
      .image(x, y, this._config.leftShadowCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._middleShadow = this._scene.add
      .image(this._leftShadowCap.x + this._leftShadowCap.width, y, this._config.middleShadowAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);
    this._middleShadow.displayWidth = this._fullWidth;

    this._rightShadowCap = this._scene.add
      .image(this._middleShadow.x + this._middleShadow.displayWidth, y, this._config.rightShadowCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._container.add([this._leftShadowCap, this._middleShadow, this._rightShadowCap]);
  }

  _createBarImages(x: number, y: number) {
    this._leftCap = this._scene.add
      .image(x, y, this._config.leftCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._middle = this._scene.add
      .image(this._leftCap.x + this._leftCap.width, y, this._config.middleAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._rightCap = this._scene.add
      .image(this._middle.x + this._middle.displayWidth, y, this._config.rightCapAssetKey)
      .setOrigin(0, 0.5)
      .setScale(1, this._scaleY);

    this._container.add([this._leftCap, this._middle, this._rightCap]);
  }

  _setMeterPercentage(percent: number = 1) {
    const width = this._fullWidth * percent;
    this._middle.displayWidth = width;
    this._updateBarGameObjects();
  }

  _updateBarGameObjects() {
    this._rightCap.x = this._middle.x + this._middle.displayWidth;
    const isVisible = this._middle.displayWidth > 0;
    this._leftCap.visible = isVisible;
    this._middle.visible = isVisible;
    this._rightCap.visible = isVisible;
  }

  setMeterPercentageAnimated(
    percent: number,
    options?: {
      duration?: number;
      callback?: () => void;
      skipBattleAnimations?: boolean;
    },
  ) {
    const width = this._fullWidth * percent;

    if (options?.skipBattleAnimations) {
      this._setMeterPercentage(percent);
      if (options?.callback) {
        options.callback();
      }
      return;
    }

    this._scene.tweens.add({
      targets: this._middle,
      displayWidth: width,
      duration: options?.duration || options?.duration === 0 ? 0 : 1000,
      ease: Phaser.Math.Easing.Sine.Out,
      onUpdate: () => {
        this._updateBarGameObjects();
      },
      onComplete: options?.callback,
    });
  }
}
