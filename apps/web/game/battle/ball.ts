export interface BallConfig {
  scene: Phaser.Scene;
  assetKey: string;
  assetFrame?: number; // defaults to 0
  skipBattleAnimations?: boolean; // defaults to false
  scale?: number; // defaults to 1
}

export class Ball {
  #scene: Phaser.Scene;
  #ball: Phaser.GameObjects.PathFollower;
  #ballPath: Phaser.Curves.Path;
  #ballPathGraphics: Phaser.GameObjects.Graphics;
  #skipBattleAnimations: boolean;

  constructor(config: BallConfig) {
    if (config.assetFrame === undefined) {
      config.assetFrame = 0;
    }
    if (config.scale === undefined) {
      config.scale = 1;
    }
    if (config.skipBattleAnimations === undefined) {
      config.skipBattleAnimations = false;
    }
    this.#skipBattleAnimations = config.skipBattleAnimations;
    this.#scene = config.scene;
    this.#createCurvePath();
    this.#ball = this.#scene.add
      .follower(this.#ballPath, 0, 500, config.assetKey, config.assetFrame)
      .setAlpha(0)
      .setScale(config.scale);
  }

  #createCurvePath() {
    // create curved path for ball to follow
    const startPoint = new Phaser.Math.Vector2(0, 500);
    const controlPoint1 = new Phaser.Math.Vector2(200, 100);
    const controlPoint2 = new Phaser.Math.Vector2(725, 180);
    const endPoint = new Phaser.Math.Vector2(725, 180);
    const curve = new Phaser.Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint);
    this.#ballPath = new Phaser.Curves.Path(0, 500).add(curve);

    // draw curve (for debugging)
    this.#ballPathGraphics = this.#scene.add.graphics();
    this.#ballPathGraphics.clear();
    this.#ballPathGraphics.lineStyle(4, 0x00ff00, 1);
    this.#ballPath.draw(this.#ballPathGraphics);
    this.#ballPathGraphics.setAlpha(0);
  }

  hide() {
    this.#ball.setAlpha(0);
  }

  showBallPath() {
    this.#ballPathGraphics.setAlpha(1);
  }

  hideBallPath() {
    this.#ballPathGraphics.setAlpha(0);
  }

  playThrowBallAnimation() {
    return new Promise<void>(resolve => {
      if (this.#skipBattleAnimations) {
        this.#ball.setPosition(725, 180);
        this.#ball.setAlpha(1);
        resolve();
        return;
      }

      this.#ball.setPosition(0, 500);
      this.#ball.setAlpha(1);
      this.#ball.startFollow({
        delay: 0,
        duration: 1000,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  playShakeBallAnimation(repeat: number = 2) {
    return new Promise<void>(resolve => {
      if (this.#skipBattleAnimations) {
        resolve();
        return;
      }

      this.#scene.tweens.add({
        duration: 150,
        repeatDelay: 800,
        targets: this.#ball,
        x: this.#ball.x + 10,
        y: this.#ball.y + 0,
        yoyo: true,
        repeat,
        delay: 200,
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
