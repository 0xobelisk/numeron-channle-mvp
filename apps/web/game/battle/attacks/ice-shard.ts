import { ATTACK_ASSET_KEYS } from '../../assets/asset-keys';
import { Attack } from './attack';
import { Coordinate } from '../../types/typedef';

export class IceShard extends Attack {
  _attackGameObject: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, position: Coordinate) {
    super(scene, position);

    // create game object
    this._attackGameObject = this._scene.add
      .sprite(this._position.x, this._position.y, ATTACK_ASSET_KEYS.ICE_SHARD, 5)
      .setOrigin(0.5)
      .setScale(4)
      .setAlpha(0);
  }

  playAnimation(callback?: () => void) {
    if (this._isAnimationPlaying) {
      return;
    }

    this._isAnimationPlaying = true;
    this._attackGameObject.setAlpha(1);

    // play animation and once complete call the callback
    this._attackGameObject.play(ATTACK_ASSET_KEYS.ICE_SHARD_START);

    this._attackGameObject.once(
      Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD_START,
      () => {
        this._attackGameObject.play(ATTACK_ASSET_KEYS.ICE_SHARD);
      },
    );

    this._attackGameObject.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ATTACK_ASSET_KEYS.ICE_SHARD, () => {
      this._isAnimationPlaying = false;
      this._attackGameObject.setAlpha(0).setFrame(0);

      if (callback) {
        callback();
      }
    });
  }
}
