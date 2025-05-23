import { WORLD_ASSET_KEYS } from '../assets/asset-keys';
import { Coordinate } from '../types/typedef';

export type ItemConfig = {
  scene: Phaser.Scene;
  position: Coordinate;
  itemId: number;
  id: number;
};

export class Item {
  #scene: Phaser.Scene;
  #phaserGameObject: Phaser.GameObjects.Image;
  #id: number;
  #itemId: number;

  constructor(config: ItemConfig) {
    this.#id = config.id;
    this.#itemId = config.itemId;
    this.#scene = config.scene;
    this.#phaserGameObject = this.#scene.add
      .image(config.position.x, config.position.y, WORLD_ASSET_KEYS.BEACH, 22)
      .setOrigin(0);
  }

  get gameObject(): Phaser.GameObjects.Image {
    return this.#phaserGameObject;
  }

  get position(): Coordinate {
    return {
      x: this.#phaserGameObject.x,
      y: this.#phaserGameObject.y,
    };
  }

  get itemId(): number {
    return this.#itemId;
  }

  get id(): number {
    return this.#id;
  }
}
