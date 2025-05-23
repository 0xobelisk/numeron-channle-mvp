import { SCENE_KEYS } from './scene-keys';
import { BaseScene } from './base-scene';

export class CutsceneScene extends BaseScene {
  #topBar: Phaser.GameObjects.Rectangle;
  #bottomBar: Phaser.GameObjects.Rectangle;

  constructor() {
    super({
      key: SCENE_KEYS.CUTSCENE_SCENE,
    });
  }

  async create() {
    this.#topBar = this.add.rectangle(0, 0, this.scale.width, 100, 0x000000, 0.8).setOrigin(0).setVisible(false);
    this.#bottomBar = this.add
      .rectangle(0, this.scale.height - 100, this.scale.width, 100, 0x000000, 0.8)
      .setOrigin(0)
      .setVisible(false);
    this.scene.bringToTop();
  }

  async startCutScene(): Promise<void> {
    this.#topBar.setY(-100).setVisible(true);
    this.#bottomBar.setY(this.scale.height).setVisible(true);

    await Promise.all([
      this.#animateBar(this.#topBar, -100, 0),
      this.#animateBar(this.#bottomBar, this.scale.height, this.scale.height - 100),
    ]);
  }

  async endCutScene(): Promise<void> {
    await Promise.all([
      this.#animateBar(this.#topBar, 0, -100),
      this.#animateBar(this.#bottomBar, this.scale.height - 100, this.scale.height),
    ]);

    this.#topBar.setVisible(false);
    this.#bottomBar.setVisible(false);
  }

  #animateBar(target: Phaser.GameObjects.GameObject, startY: number, endY: number): Promise<void> {
    return new Promise((resolve: () => void) => {
      this.tweens.add({
        targets: target,
        delay: 0,
        duration: 800,
        y: {
          from: startY,
          start: startY,
          to: endY,
        },
        onComplete: resolve,
      });
    });
  }
}
