import { Coordinate } from '../../types/typedef';

export class Attack {
  _scene: Phaser.Scene;
  _position: Coordinate;
  _isAnimationPlaying: boolean;
  _attackGameObject: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container | undefined;

  constructor(scene: Phaser.Scene, position: Coordinate) {
    if (this.constructor === Attack) {
      throw new Error('Attack is an abstract class and cannot be instantiated.');
    }

    this._scene = scene;
    this._position = position;
    this._isAnimationPlaying = false;
    this._attackGameObject = undefined;
  }

  get gameObject() {
    return this._attackGameObject;
  }

  playAnimation(callback?: () => void) {
    throw new Error('playAnimation is not implemented.');
  }
}
