export function sleep(milliseconds: number, scene: Phaser.Scene): Promise<void> {
  return new Promise(resolve => {
    scene.time.delayedCall(milliseconds, () => {
      resolve();
    });
  });
}
