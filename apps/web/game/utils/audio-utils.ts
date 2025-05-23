import { SOUND_OPTIONS } from '../common/options';
import { DATA_MANAGER_STORE_KEYS, dataManager } from './data-manager';

export function playBackgroundMusic(scene: Phaser.Scene, audioKey: string) {
  if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !== SOUND_OPTIONS.ON) {
    return;
  }

  // get all of the audio objects that are currently playing so we can check if the sound we
  // want to play is already playing, and to stop all other sounds
  const existingSounds = scene.sound.getAllPlaying();
  let musicAlreadyPlaying = false;

  existingSounds.forEach(sound => {
    if (sound.key === audioKey) {
      musicAlreadyPlaying = true;
      return;
    }
    sound.stop();
  });

  if (!musicAlreadyPlaying) {
    scene.sound.play(audioKey, {
      loop: true,
    });
  }
}

export function playSoundFx(scene: Phaser.Scene, audioKey: string) {
  if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) !== SOUND_OPTIONS.ON) {
    return;
  }

  const baseVolume = dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25;

  scene.sound.play(audioKey, {
    volume: 20 * baseVolume,
  });
}

export function setGlobalSoundSettings(scene: Phaser.Scene) {
  scene.sound.setVolume(dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_VOLUME) * 0.25);
  scene.sound.setMute(dataManager.store.get(DATA_MANAGER_STORE_KEYS.OPTIONS_SOUND) === SOUND_OPTIONS.ON);
}
