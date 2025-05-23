import { Pane } from 'tweakpane';
import { Background } from '../battle/background';
import { ATTACK_KEYS } from '../battle/attacks/attack-keys';
import { IceShard } from '../battle/attacks/ice-shard';
import { Slash } from '../battle/attacks/slash';
import { BATTLE_ASSET_KEYS, MONSTER_ASSET_KEYS } from '../assets/asset-keys';
import { SCENE_KEYS } from './scene-keys';
import { makeDraggable } from '../utils/draggable';
import { Ball } from '../battle/ball';
import { sleep } from '../utils/time-utils';
import { AttackKeys } from '../battle/attacks/attack-keys';

export class TestScene extends Phaser.Scene {
  #selectedAttack: AttackKeys;
  #iceShardAttack: IceShard;
  #slashAttack: Slash;
  #playerMonster: Phaser.GameObjects.Image;
  #enemyMonster: Phaser.GameObjects.Image;
  #ball: Ball;

  constructor() {
    super({ key: SCENE_KEYS.TEST_SCENE });
  }

  init() {
    this.#selectedAttack = ATTACK_KEYS.SLASH;
  }

  create() {
    const background = new Background(this);
    background.showForest();

    this.#playerMonster = this.add.image(256, 316, MONSTER_ASSET_KEYS.IGUANIGNITE, 0).setFlipX(true);
    this.#enemyMonster = this.add.image(768, 144, MONSTER_ASSET_KEYS.CARNODUSK, 0).setFlipX(false);
    makeDraggable(this.#enemyMonster);

    this.#iceShardAttack = new IceShard(this, { x: 256, y: 344 });
    this.#slashAttack = new Slash(this, { x: 745, y: 140 });

    this.#ball = new Ball({
      scene: this,
      assetKey: BATTLE_ASSET_KEYS.DAMAGED_BALL,
      assetFrame: 0,
      scale: 0.1,
    });
    this.#ball.showBallPath();

    this.#addDataGui();
  }

  #addDataGui() {
    const pane = new Pane();

    const f1 = pane.addFolder({
      title: 'Monsters',
      expanded: false,
    });
    const playerMonsterFolder = f1.addFolder({
      title: 'Player',
      expanded: true,
    });
    playerMonsterFolder.addBinding(this.#playerMonster, 'x', {
      min: 0,
      max: 1024,
      step: 1,
    });
    playerMonsterFolder.addBinding(this.#playerMonster, 'y', {
      min: 0,
      max: 576,
      step: 1,
    });

    const enemyMonsterFolder = f1.addFolder({
      title: 'Enemy',
      expanded: true,
    });
    enemyMonsterFolder.addBinding(this.#enemyMonster, 'x', { readonly: true });
    enemyMonsterFolder.addBinding(this.#enemyMonster, 'y', { readonly: true });

    const f2Params = {
      attack: this.#selectedAttack,
      x: 745,
      y: 120,
    };
    const f2 = pane.addFolder({
      title: 'Attacks',
      expanded: false,
    });
    f2.addBinding(f2Params, 'attack', {
      options: {
        [ATTACK_KEYS.SLASH]: ATTACK_KEYS.SLASH,
        [ATTACK_KEYS.ICE_SHARD]: ATTACK_KEYS.ICE_SHARD,
      },
    }).on('change', ev => {
      if (ev.value === ATTACK_KEYS.ICE_SHARD) {
        this.#selectedAttack = ATTACK_KEYS.ICE_SHARD;
        f2Params.x = this.#iceShardAttack.gameObject.x;
        f2Params.y = this.#iceShardAttack.gameObject.y;
        f2.refresh();
        return;
      }
      if (ev.value === ATTACK_KEYS.SLASH) {
        this.#selectedAttack = ATTACK_KEYS.SLASH;
        f2Params.x = this.#slashAttack.gameObject.x;
        f2Params.y = this.#slashAttack.gameObject.y;
        f2.refresh();
        return;
      }
    });

    const playAttackButton = f2.addButton({
      title: 'Play',
    });
    playAttackButton.on('click', () => {
      if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
        this.#iceShardAttack.playAnimation();
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
        this.#slashAttack.playAnimation();
        return;
      }
    });

    f2.addBinding(f2Params, 'x', {
      min: 0,
      max: 1024,
      step: 1,
    }).on('change', ev => {
      this.#updateAttackGameObjectPosition('x', ev.value);
    });
    f2.addBinding(f2Params, 'y', {
      min: 0,
      max: 576,
      step: 1,
    }).on('change', ev => {
      this.#updateAttackGameObjectPosition('y', ev.value);
    });

    const f3 = pane.addFolder({
      title: 'Monster Ball',
      expanded: true,
    });
    const f3Params = {
      showPath: true,
    };
    f3.addBinding(f3Params, 'showPath', {
      label: 'show path',
    }).on('change', ev => {
      if (ev.value) {
        this.#ball.showBallPath();
      } else {
        this.#ball.hideBallPath();
      }
    });
    const playThrowBallButton = f3.addButton({
      title: 'Play Catch Animation',
    });
    playThrowBallButton.on('click', async () => {
      await this.#ball.playThrowBallAnimation();
      await this.#catchEnemy();
      await this.#ball.playShakeBallAnimation(2);
      await sleep(500, this);
      this.#ball.hide();
      await this.#catchEnemyFailed();
    });
  }

  #updateAttackGameObjectPosition(param: 'x' | 'y', value: number) {
    if (param === 'x') {
      if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
        this.#slashAttack.gameObject.setX(value);
        return;
      }
      if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
        this.#iceShardAttack.gameObject.setX(value);
        return;
      }
    }
    if (this.#selectedAttack === ATTACK_KEYS.SLASH) {
      this.#slashAttack.gameObject.setY(value);
      return;
    }
    if (this.#selectedAttack === ATTACK_KEYS.ICE_SHARD) {
      this.#iceShardAttack.gameObject.setY(value);
      return;
    }
  }

  #catchEnemy(): Promise<void> {
    return new Promise((resolve: () => void) => {
      this.tweens.add({
        duration: 500,
        targets: this.#enemyMonster,
        alpha: {
          from: 1,
          start: 1,
          to: 0,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  #catchEnemyFailed(): Promise<void> {
    return new Promise((resolve: () => void) => {
      this.tweens.add({
        duration: 500,
        targets: this.#enemyMonster,
        alpha: {
          from: 0,
          start: 0,
          to: 1,
        },
        ease: Phaser.Math.Easing.Sine.InOut,
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
