import { BATTLE_ASSET_KEYS } from '../../assets/asset-keys';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../../assets/font-keys';
import { DataUtils } from '../../utils/data-utils';
import { HealthBar } from '../../common/health-bar';
import { Monster, Attack, BattleMonsterConfig, Coordinate } from '../../types/typedef';

export class BattleMonster {
  _scene: Phaser.Scene;
  _monsterDetails: Monster;
  _healthBar: HealthBar;
  _phaserGameObject: Phaser.GameObjects.Image;
  _currentHealth: number;
  _maxHealth: number;
  _monsterAttacks: Attack[];
  _phaserHealthBarGameContainer: Phaser.GameObjects.Container;
  _skipBattleAnimations: boolean;
  _monsterHealthBarLevelText: Phaser.GameObjects.Text;
  _monsterNameText: Phaser.GameObjects.Text;

  constructor(config: BattleMonsterConfig, position: Coordinate) {
    if (this.constructor === BattleMonster) {
      throw new Error('BattleMonster is an abstract class and cannot be instantiated.');
    }
    this._scene = config.scene;
    this._monsterDetails = config.monsterDetails;
    this._currentHealth = this._monsterDetails.currentHp;
    this._maxHealth = this._monsterDetails.maxHp;
    this._monsterAttacks = [];
    this._skipBattleAnimations = config.skipBattleAnimations || false;

    this._phaserGameObject = this._scene.add
      .image(position.x, position.y, this._monsterDetails.assetKey, this._monsterDetails.assetFrame || 0)
      .setAlpha(0);
    this.#createHealthBarComponents(config.scaleHealthBarBackgroundImageByY);
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      skipBattleAnimations: true,
    });

    this._monsterDetails.attackIds.forEach(attackId => {
      const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId);
      if (monsterAttack !== undefined) {
        this._monsterAttacks.push(monsterAttack);
      }
    });
  }

  get currentHp(): number {
    return this._currentHealth;
  }

  get maxHp(): number {
    return this._maxHealth;
  }

  get isFainted(): boolean {
    return this._currentHealth <= 0;
  }

  get name(): string {
    return this._monsterDetails.name;
  }

  get attacks(): Attack[] {
    return [...this._monsterAttacks];
  }

  get baseAttack(): number {
    return this._monsterDetails.currentAttack;
  }

  get level(): number {
    return this._monsterDetails.currentLevel;
  }

  switchMonster(monster: Monster) {
    this._monsterDetails = monster;
    this._currentHealth = this._monsterDetails.currentHp;
    this._maxHealth = this._monsterDetails.maxHp;
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      skipBattleAnimations: true,
    });
    this._monsterAttacks = [];
    this._monsterDetails.attackIds.forEach(attackId => {
      const monsterAttack = DataUtils.getMonsterAttack(this._scene, attackId);
      if (monsterAttack !== undefined) {
        this._monsterAttacks.push(monsterAttack);
      }
    });
    this._phaserGameObject.setTexture(this._monsterDetails.assetKey, this._monsterDetails.assetFrame || 0);
    this._monsterNameText.setText(this._monsterDetails.name);
    this._setMonsterLevelText();
    this._monsterHealthBarLevelText.setX(this._monsterNameText.width + 35);
  }

  takeDamage(damage: number, callback?: () => void) {
    // update current monster health and animate health bar
    this._currentHealth -= damage;
    if (this._currentHealth < 0) {
      this._currentHealth = 0;
    }
    this._healthBar.setMeterPercentageAnimated(this._currentHealth / this._maxHealth, {
      callback,
      skipBattleAnimations: this._skipBattleAnimations,
    });
  }

  playMonsterAppearAnimation(callback?: () => void) {
    throw new Error('playMonsterAppearAnimation is not implemented.');
  }

  playMonsterHealthBarAppearAnimation(callback?: () => void) {
    throw new Error('playMonsterHealthBarAppearAnimation is not implemented.');
  }

  playDeathAnimation(callback: () => void) {
    throw new Error('playDeathAnimation is not implemented.');
  }

  playTakeDamageAnimation(callback: () => void) {
    if (this._skipBattleAnimations) {
      this._phaserGameObject.setAlpha(1);
      callback();
      return;
    }

    this._scene.tweens.add({
      delay: 0,
      duration: 150,
      targets: this._phaserGameObject,
      alpha: {
        from: 1,
        start: 1,
        to: 0,
      },
      repeat: 10,
      onComplete: () => {
        this._phaserGameObject.setAlpha(1);
        callback();
      },
    });
  }

  _setMonsterLevelText() {
    this._monsterHealthBarLevelText.setText(`L${this.level}`);
  }

  #createHealthBarComponents(scaleHealthBarBackgroundImageByY = 1) {
    this._healthBar = new HealthBar(this._scene, 34, 34);

    this._monsterNameText = this._scene.add.text(30, 20, this.name, {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#7E3D3F',
      fontSize: '32px',
    });

    const healthBarBgImage = this._scene.add
      .image(0, 0, BATTLE_ASSET_KEYS.HEALTH_BAR_BACKGROUND)
      .setOrigin(0)
      .setScale(1, scaleHealthBarBackgroundImageByY);

    this._monsterHealthBarLevelText = this._scene.add.text(this._monsterNameText.width + 35, 23, '', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#ED474B',
      fontSize: '28px',
    });
    this._setMonsterLevelText();

    const monsterHpText = this._scene.add.text(30, 55, 'HP', {
      fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
      color: '#FF6505',
      fontSize: '24px',
      fontStyle: 'italic',
    });

    this._phaserHealthBarGameContainer = this._scene.add
      .container(0, 0, [
        healthBarBgImage,
        this._monsterNameText,
        this._healthBar.container,
        this._monsterHealthBarLevelText,
        monsterHpText,
      ])
      .setAlpha(0);
  }
}
