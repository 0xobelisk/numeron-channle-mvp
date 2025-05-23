export interface AnimateTextConfig {
  callback?: () => void;
  delay?: number; // defaults to 25
}

export function animateText(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Text,
  text: string,
  config?: AnimateTextConfig,
) {
  const length = text.length;
  let i = 0;
  scene.time.addEvent({
    callback: () => {
      target.text += text[i];
      ++i;
      if (i === length - 1 && config?.callback) {
        config.callback();
      }
    },
    repeat: length - 1,
    delay: config?.delay || 25,
  });
}

export const CANNOT_READ_SIGN_TEXT = 'You cannot read the sign from this direction.';
export const SAMPLE_TEXT = 'Make sure you talk to npcs for helpful tips!';
export const LONG_SAMPLE_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Enim sed faucibus turpis in eu mi bibendum.';
