import { KENNEY_FUTURE_NARROW_FONT_NAME } from '@/game/assets/font-keys';
import { ExpBar } from '../../common/exp-bar';
import { calculateExpBarCurrentValue, handleMonsterGainingExperience } from '../../utils/leveling-utils';
import { BattleMonsterConfig, Coordinate, Monster } from '@/game/types/typedef';
import { BattleMonster } from './battle-monster';
import { StatChanges } from '../../utils/leveling-utils';

const PLAYER_POSITION: Coordinate = Object.freeze({
  x: 256,
  y: 316,
});

export class PlayerBattleMonster extends BattleMonster {
  #healthBarTextGameObject: Phaser.GameObjects.Text;
  #expBar: ExpBar;

  constructor(config: BattleMonsterConfig) {
    super(config, PLAYER_POSITION);
    this._phaserGameObject.setFlipX(true);
    this._phaserHealthBarGameContainer.setPosition(556, 318);

    this.#addHealthBarComponents();
    this.#addExpBarComponents();
  }

  #setHealthBarText() {
    this.#healthBarTextGameObject.setText(`${this._currentHealth}/${this._maxHealth}`);
  }

  #addHealthBarComponents() {
    this.#healthBarTextGameObject = this._scene.add
      .text(443, 80, '', {
        fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
        color: '#7E3D3F',
        fontSize: '16px',
      })
      .setOrigin(1, 0);
    this.#setHealthBarText();

    this._phaserHealthBarGameContainer.add(this.#healthBarTextGameObject);
  }

  takeDamage(damage: number, callback?: () => void) {
    super.takeDamage(damage, callback);
    this.#setHealthBarText();
  }

  playMonsterAppearAnimation(callback: () => void) {
    const startXPos = -30;
    const endXPos = PLAYER_POSITION.x;
    this._phaserGameObject.setPosition(startXPos, PLAYER_POSITION.y);
    this._phaserGameObject.setAlpha(1);

    if (this._skipBattleAnimations) {
      this._phaserGameObject.setX(endXPos);
      callback();
      return;
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 800,
      x: {
        from: startXPos,
        start: startXPos,
        to: endXPos,
      },
      targets: this._phaserGameObject,
      onComplete: () => {
        callback();
      },
    });
  }

  playMonsterHealthBarAppearAnimation(callback: () => void) {
    const startXPos = 800;
    const endXPos = this._phaserHealthBarGameContainer.x;
    this._phaserHealthBarGameContainer.setPosition(startXPos, this._phaserHealthBarGameContainer.y);
    this._phaserHealthBarGameContainer.setAlpha(1);

    if (this._skipBattleAnimations) {
      this._phaserHealthBarGameContainer.setX(endXPos);
      callback();
      return;
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 800,
      x: {
        from: startXPos,
        start: startXPos,
        to: endXPos,
      },
      targets: this._phaserHealthBarGameContainer,
      onComplete: () => {
        callback();
      },
    });
  }

  playDeathAnimation(callback: () => void) {
    const startYPos = this._phaserGameObject.y;
    const endYPos = startYPos + 400;
    const healthBarStartXPos = this._phaserHealthBarGameContainer.x;
    const healthBarEndXPos = 1200;

    if (this._skipBattleAnimations) {
      this._phaserGameObject.setY(endYPos);
      this._phaserHealthBarGameContainer.setAlpha(0);
      callback();
      return;
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 2000,
      y: {
        from: startYPos,
        start: startYPos,
        to: endYPos,
      },
      targets: this._phaserGameObject,
      onComplete: () => {
        callback();
      },
    });

    this._scene.tweens.add({
      delay: 0,
      duration: 2000,
      x: {
        from: this._phaserHealthBarGameContainer.x,
        start: this._phaserHealthBarGameContainer.x,
        to: healthBarEndXPos,
      },
      targets: this._phaserHealthBarGameContainer,
      onComplete: () => {
        this._phaserHealthBarGameContainer.setAlpha(0);
        this._phaserHealthBarGameContainer.setX(healthBarStartXPos);
      },
    });
  }

  updateMonsterHealth(updatedHp: number) {
    this._currentHealth = updatedHp;
    if (this._currentHealth > this._maxHealth) {
      this._currentHealth = this._maxHealth;
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      skipBattleAnimations: true,
    });
    this.#setHealthBarText();
  }

  #addExpBarComponents() {
    this.#expBar = new ExpBar(this._scene, 34, 54);
    this.#expBar.setMeterPercentageAnimated(
      calculateExpBarCurrentValue(this._monsterDetails.currentLevel, this._monsterDetails.currentExp),
      { skipBattleAnimations: true },
    );

    const monsterExpText = this._scene.add.text(30, 100, 'EXP', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#6505FF',
      fontSize: '14px',
      fontStyle: 'italic',
    });

    this._phaserHealthBarGameContainer.add([monsterExpText, this.#expBar.container]);
  }

  updateMonsterExp(gainedExp: number): StatChanges {
    return handleMonsterGainingExperience(this._monsterDetails, gainedExp);
  }

  updateMonsterExpBar(leveledUp: boolean, skipBattleAnimations: boolean, callback?: () => void) {
    if (callback === undefined) {
      callback = () => {};
    }

    const cb = () => {
      this._setMonsterLevelText();
      this._maxHealth = this._monsterDetails.maxHp;
      this.updateMonsterHealth(this._currentHealth);
      callback();
    };

    // if monster leveled up, we want to show the bar being filled up to 100%, waiting a small
    // period of time, and then animate to the proper value
    if (leveledUp) {
      this.#expBar.setMeterPercentageAnimated(1, {
        callback: () => {
          this._scene.time.delayedCall(500, () => {
            this.#expBar.setMeterPercentageAnimated(0, { skipBattleAnimations: true });
            this.#expBar.setMeterPercentageAnimated(
              calculateExpBarCurrentValue(this._monsterDetails.currentLevel, this._monsterDetails.currentExp),
              {
                callback: cb,
              },
            );
          });
        },
      });
      return;
    }

    // if the monster did not level up, we can just animate the bar to the proper value
    this.#expBar.setMeterPercentageAnimated(
      calculateExpBarCurrentValue(this._monsterDetails.currentLevel, this._monsterDetails.currentExp),
      {
        callback: cb,
      },
    );
  }

  switchMonster(monster: Monster) {
    super.switchMonster(monster);
    this.#setHealthBarText();
    this.updateMonsterExpBar(false, true, undefined);
  }
}
