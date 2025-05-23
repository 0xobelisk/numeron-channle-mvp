import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys';
import { Attack } from './attack';
import { Coordinate } from '../../types/typedef';

export class Slash extends Attack {
  _attackGameObject: Phaser.GameObjects.Container;
  _attackGameObject1: Phaser.GameObjects.Sprite;
  _attackGameObject2: Phaser.GameObjects.Sprite;
  _attackGameObject3: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, position: Coordinate) {
    super(scene, position);

    // create game objects
    this._attackGameObject1 = this._scene.add.sprite(0, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject2 = this._scene.add.sprite(30, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject3 = this._scene.add.sprite(-30, 0, ATTACK_ASSET_KEYS.SLASH, 0).setOrigin(0.5).setScale(4);
    this._attackGameObject = this._scene.add
      .container(this._position.x, this._position.y, [
        this._attackGameObject1,
        this._attackGameObject2,
        this._attackGameObject3,
      ])
      .setAlpha(0);
  }

  playAnimation(callback?: () => void) {
    if (this._isAnimationPlaying) {
      return;
    }

    this._isAnimationPlaying = true;
    this._attackGameObject.setAlpha(1);

    this._attackGameObject1.play(ATTACK_ASSET_KEYS.SLASH);
    this._attackGameObject2.play(ATTACK_ASSET_KEYS.SLASH);
    this._attackGameObject3.play(ATTACK_ASSET_KEYS.SLASH);

    this._attackGameObject1.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.SLASH, () => {
      this._isAnimationPlaying = false;
      this._attackGameObject.setAlpha(0);
      this._attackGameObject1.setFrame(0);
      this._attackGameObject2.setFrame(0);
      this._attackGameObject3.setFrame(0);

      if (callback) {
        callback();
      }
    });
  }
}
