import { Character } from './character';
import { CHARACTER_ASSET_KEYS } from '../../assets/asset-keys';
import { DIRECTION, Direction } from '../../common/direction';
import { exhaustiveGuard } from '../../utils/guard';
import { Coordinate, NpcEvent } from '../../types/typedef';
import { CharacterConfig } from './character';

export const NPC_MOVEMENT_PATTERN = Object.freeze({
  IDLE: 'IDLE',
  CLOCKWISE: 'CLOCKWISE',
  SET_PATH: 'SET_PATH',
});

export type NpcMovementPattern = keyof typeof NPC_MOVEMENT_PATTERN;

export type NPCPath = Record<number, Coordinate>;

export interface NPCConfigProps {
  frame: number;
  npcPath: NPCPath;
  movementPattern: NpcMovementPattern;
  events: NpcEvent[];
  animationKeyPrefix: string;
  id: number;
}

export type NPCConfig = Omit<CharacterConfig, 'assetKey' | 'idleFrameConfig'> & NPCConfigProps;

export class NPC extends Character {
  #talkingToPlayer: boolean;
  #npcPath: NPCPath;
  #currentPathIndex: number;
  #movementPattern: NpcMovementPattern;
  #lastMovementTime: number;
  #events: NpcEvent[];
  #animationKeyPrefix: string;
  #id: number;

  constructor(config: NPCConfig) {
    super({
      ...config,
      assetKey: CHARACTER_ASSET_KEYS.NPC,
      origin: { x: 0, y: 0 },
      idleFrameConfig: {
        DOWN: config.frame,
        UP: config.frame + 1,
        NONE: config.frame,
        LEFT: config.frame + 2,
        RIGHT: config.frame + 2,
      },
    });

    this.#talkingToPlayer = false;
    this.#npcPath = config.npcPath;
    this.#currentPathIndex = 0;
    this.#movementPattern = config.movementPattern;
    this.#lastMovementTime = Phaser.Math.Between(3500, 5000);
    this._phaserGameObject.setScale(4);
    this.#events = config.events;
    this.#animationKeyPrefix = config.animationKeyPrefix;
    this.#id = config.id;
  }

  get events(): NpcEvent[] {
    return [...this.#events];
  }

  get isTalkingToPlayer(): boolean {
    return this.#talkingToPlayer;
  }

  set isTalkingToPlayer(val: boolean) {
    this.#talkingToPlayer = val;
  }

  get id(): number {
    return this.#id;
  }

  get npcPath(): NPCPath {
    return this.#npcPath;
  }

  set npcPath(val: NPCPath) {
    this.#npcPath = val;
  }

  set npcMovementPattern(val: NpcMovementPattern) {
    this.#movementPattern = val;
  }

  set finishedMovementCallback(val: () => void | undefined) {
    this._spriteGridMovementFinishedCallback = val;
  }

  resetMovementTime() {
    this.#lastMovementTime = 0;
  }

  facePlayer(playerDirection: Direction) {
    switch (playerDirection) {
      case DIRECTION.DOWN:
        this._phaserGameObject.setFrame(this._idleFrameConfig.UP).setFlipX(false);
        break;
      case DIRECTION.LEFT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.RIGHT).setFlipX(false);
        break;
      case DIRECTION.RIGHT:
        this._phaserGameObject.setFrame(this._idleFrameConfig.LEFT).setFlipX(true);
        break;
      case DIRECTION.UP:
        this._phaserGameObject.setFrame(this._idleFrameConfig.DOWN).setFlipX(false);
        break;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(playerDirection);
    }
  }

  update(time: DOMHighResTimeStamp) {
    if (this._isMoving) {
      return;
    }
    if (this.#talkingToPlayer) {
      return;
    }
    super.update(time);

    if (this.#movementPattern === NPC_MOVEMENT_PATTERN.IDLE) {
      return;
    }

    if (this.#lastMovementTime < time) {
      let characterDirection: Direction = DIRECTION.NONE;
      let nextPosition = this.#npcPath[this.#currentPathIndex + 1];

      const prevPosition = this.#npcPath[this.#currentPathIndex];
      if (prevPosition.x !== this._phaserGameObject.x || prevPosition.y !== this._phaserGameObject.y) {
        nextPosition = this.#npcPath[this.#currentPathIndex];
      } else {
        if (nextPosition === undefined) {
          // if npc is following a set path, once we reach the end, stop moving the npc
          if (this.#movementPattern === NPC_MOVEMENT_PATTERN.SET_PATH) {
            this.#movementPattern = NPC_MOVEMENT_PATTERN.IDLE;
            this.#currentPathIndex = 0;
            return;
          }
          nextPosition = this.#npcPath[0];
          this.#currentPathIndex = 0;
        } else {
          this.#currentPathIndex = this.#currentPathIndex + 1;
        }
      }

      if (nextPosition.x > this._phaserGameObject.x) {
        characterDirection = DIRECTION.RIGHT;
      } else if (nextPosition.x < this._phaserGameObject.x) {
        characterDirection = DIRECTION.LEFT;
      } else if (nextPosition.y < this._phaserGameObject.y) {
        characterDirection = DIRECTION.UP;
      } else if (nextPosition.y > this._phaserGameObject.y) {
        characterDirection = DIRECTION.DOWN;
      }

      this.moveCharacter(characterDirection);
      if (this.#movementPattern === NPC_MOVEMENT_PATTERN.SET_PATH) {
        this.#lastMovementTime = time;
      } else {
        this.#lastMovementTime = time + Phaser.Math.Between(2000, 5000);
      }
    }
  }

  moveCharacter(direction: Direction) {
    super.moveCharacter(direction);

    if (!this._phaserGameObject?.anims) {
      return;
    }

    switch (this._direction) {
      case DIRECTION.DOWN:
      case DIRECTION.RIGHT:
      case DIRECTION.UP:
        if (
          !this._phaserGameObject.anims?.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `${this.#animationKeyPrefix}_${this._direction}`
        ) {
          this._phaserGameObject.play(`${this.#animationKeyPrefix}_${this._direction}`);
          this._phaserGameObject.setFlipX(false);
        }
        break;
      case DIRECTION.LEFT:
        if (
          !this._phaserGameObject.anims.isPlaying ||
          this._phaserGameObject.anims.currentAnim?.key !== `${this.#animationKeyPrefix}_${DIRECTION.RIGHT}`
        ) {
          this._phaserGameObject.play(`${this.#animationKeyPrefix}_${DIRECTION.RIGHT}`);
          this._phaserGameObject.setFlipX(true);
        }
        break;
      case DIRECTION.NONE:
        break;
      default:
        // We should never reach this default case
        exhaustiveGuard(this._direction);
    }
  }
}
