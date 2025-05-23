import { Monster } from '../types/typedef';

export type StatChanges = {
  level: number;
  health: number;
  attack: number;
};

export function totalExpNeededForLevel(level: number): number {
  if (level > 100) {
    return 100 ** 3;
  }
  return level ** 3;
}

export function expNeededForNextLevel(currentLevel: number, currentExp: number): number {
  if (currentLevel >= 100) {
    return 0;
  }
  return totalExpNeededForLevel(currentLevel + 1) - currentExp;
}

export function calculateExpBarCurrentValue(currentLevel: number, currentExp: number): number {
  const expNeededForCurrentLevel = totalExpNeededForLevel(currentLevel);
  let currentExpForBar = currentExp - expNeededForCurrentLevel;
  if (currentExpForBar < 0) {
    currentExpForBar = 0;
  }
  const expForNextLevel = totalExpNeededForLevel(currentLevel + 1);
  const maxExpForBar = expForNextLevel - expNeededForCurrentLevel;
  return currentExpForBar / maxExpForBar;
}

export function calculateExpGainedFromMonster(baseExp: number, currentLevel: number, isActiveMonster: boolean): number {
  return Math.round(((baseExp * currentLevel) / 7) * (1 / (isActiveMonster ? 1 : 2)));
}

export function handleMonsterGainingExperience(monster: Monster, gainedExp: number): StatChanges {
  if (monster.currentLevel === 100) {
    return;
  }

  monster.currentExp += gainedExp;
  // check if we have enough exp to gain a level
  let gainedLevel = false;
  const statChanges = {
    level: 0,
    health: 0,
    attack: 0,
  };
  do {
    gainedLevel = false;
    const expRequiredForNextLevel = totalExpNeededForLevel(monster.currentLevel + 1);
    if (monster.currentExp >= expRequiredForNextLevel) {
      monster.currentLevel += 1;
      const bonusAttack = Phaser.Math.Between(0, 1);
      const bonusHealth = Phaser.Math.Between(0, 3);
      const hpIncrease = 5 + bonusHealth;
      const atkIncrease = 1 + bonusAttack;
      monster.maxHp += hpIncrease;
      monster.currentAttack += atkIncrease;
      statChanges.level += 1;
      statChanges.health += hpIncrease;
      statChanges.attack += atkIncrease;

      gainedLevel = true;
    }
  } while (gainedLevel);

  return statChanges;
}
