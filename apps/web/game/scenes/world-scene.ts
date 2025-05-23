import { AUDIO_ASSET_KEYS, WORLD_ASSET_KEYS } from '../assets/asset-keys';
import { SCENE_KEYS } from './scene-keys';
import { Player } from '../world/characters/player';
import { DIRECTION, Direction } from '../common/direction';
import { ENABLE_ZONE_DEBUGGING, TILED_COLLISION_LAYER_ALPHA, TILE_SIZE } from '../config';
import { DATA_MANAGER_STORE_KEYS, dataManager } from '../utils/data-manager';
import {
  getTargetDirectionFromGameObjectPosition,
  getTargetPathToGameObject,
  getTargetPositionFromGameObjectPositionAndDirection,
} from '../utils/grid-utils';
import { CANNOT_READ_SIGN_TEXT, SAMPLE_TEXT } from '../utils/text-utils';
import { NPC, NPC_MOVEMENT_PATTERN } from '../world/characters/npc';
import { WorldMenu } from '../world/world-menu';
import { BaseScene } from './base-scene';
import { DataUtils } from '../utils/data-utils';
import { playBackgroundMusic, playSoundFx } from '../utils/audio-utils';
import { weightedRandom } from '../utils/random';
import { Item } from '../world/item';
import { ENCOUNTER_TILE_TYPE, GAME_EVENT_TYPE, MAP_ID_TYPE, NPC_EVENT_TYPE } from '../types/typedef';
import { exhaustiveGuard } from '../utils/guard';
import { sleep } from '../utils/time-utils';
import { CutsceneScene } from './cutscene-scene';
import { DialogScene } from './dialog-scene';
import { BattleSceneData } from './battle-scene';
import { NPCPath, NpcMovementPattern } from '../world/characters/npc';
import {
  Monster,
  GameEventAddNpc,
  EncounterTileType,
  Coordinate,
  GameEventRemoveFlag,
  GameEventAddFlag,
  GameEventGiveMonster,
  GameEventTalkToPlayer,
  GameEventRetracePath,
  GameEventRemoveNpc,
  GameEventMoveToPlayer,
} from '../types/typedef';
import { MonsterPartySceneData } from './monster-party-scene';
import { InventorySceneData } from './inventory-scene';
import { PlayerLocation } from '../utils/data-manager';
import { Dubhe, loadMetadata, SubscriptionKind, Transaction } from '@0xobelisk/sui-client';
import { DUBHE_SCHEMA_ID, NETWORK, PACKAGE_ID, SCHEMA_ID } from 'contracts/deployment';
import { ChatScene } from './chat-scene';
import { MessageType } from './chat-scene';
import { walletUtils } from '../utils/wallet-utils';

export type TiledObjectProperty = {
  name: string;
  type: string;
  value: any;
};

const TILED_SIGN_PROPERTY = Object.freeze({
  MESSAGE: 'message',
});

const CUSTOM_TILED_TYPES = Object.freeze({
  NPC: 'npc',
  NPC_PATH: 'npc_path',
});

const TILED_NPC_PROPERTY = Object.freeze({
  MOVEMENT_PATTERN: 'movement_pattern',
  FRAME: 'frame',
  ID: 'id',
});

const TILED_ENCOUNTER_PROPERTY = Object.freeze({
  AREA: 'area',
  TILE_TYPE: 'tileType',
});

const TILED_ITEM_PROPERTY = Object.freeze({
  ITEM_ID: 'item_id',
  ID: 'id',
});

const TILED_AREA_METADATA_PROPERTY = Object.freeze({
  FAINT_LOCATION: 'faint_location',
  ID: 'id',
});

const TILED_EVENT_PROPERTY = Object.freeze({
  ID: 'id',
});

export type WorldSceneData = {
  isPlayerKnockedOut?: boolean;
  area?: string;
  isInterior?: boolean;
};

/*
  Our scene will be 16 x 9 (1024 x 576 pixels)
  each grid size will be 64 x 64 pixels
*/

export class WorldScene extends BaseScene {
  #player: Player;
  #encounterLayers: Phaser.Tilemaps.TilemapLayer[];
  #wildMonsterEncountered: boolean;
  #signLayer: Phaser.Tilemaps.ObjectLayer | undefined;
  #dialogUi: DialogScene;
  #chatUi: ChatScene;
  #npcs: NPC[];
  #npcPlayerIsInteractingWith: NPC | undefined;
  #menu: WorldMenu;
  #sceneData: WorldSceneData;
  #items: Item[];
  #entranceLayer: Phaser.Tilemaps.ObjectLayer | undefined;
  #lastNpcEventHandledIndex: number;
  #isProcessingNpcEvent: boolean;
  #eventZones: Record<string, Phaser.GameObjects.Zone>;
  #debugEventZoneObjects: Record<string, Phaser.GameObjects.Rectangle>;
  #rectangleForOverlapCheck1: Phaser.Geom.Rectangle;
  #rectangleForOverlapCheck2: Phaser.Geom.Rectangle;
  #rectangleOverlapResult: Phaser.Geom.Rectangle;
  #gfx: Phaser.GameObjects.Graphics;
  #currentCutSceneId: number | undefined;
  #isProcessingCutSceneEvent: boolean;
  #lastCutSceneEventHandledIndex: number;
  #specialEncounterTileImageGameObjectGroup: Phaser.GameObjects.Group;
  #encounterZonePlayerIsEntering: Phaser.Tilemaps.TilemapLayer | undefined;
  dubhe: Dubhe;
  schemaId: string;
  subscription: WebSocket;

  constructor() {
    super({
      key: SCENE_KEYS.WORLD_SCENE,
    });
  }

  async init(data: WorldSceneData) {
    super.init(data);
    this.#sceneData = data;

    // handle when some of the fields for scene data are not populated, default to values provided, otherwise use safe defaults
    const area: string = this.#sceneData?.area || dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION).area;
    let isInterior = this.#sceneData?.isInterior;
    if (isInterior === undefined) {
      isInterior = dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION).isInterior;
    }
    const isPlayerKnockedOut = this.#sceneData?.isPlayerKnockedOut || false;

    this.#sceneData = {
      area,
      isInterior,
      isPlayerKnockedOut,
    };

    // update player location, and map data if the player was knocked out in a battle
    if (this.#sceneData.isPlayerKnockedOut) {
      // get the nearest knocked out spawn location from the map meta data
      let map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
      const areaMetaDataProperties = map.getObjectLayer('Area-Metadata').objects[0].properties;
      const knockOutSpawnLocation = (areaMetaDataProperties as TiledObjectProperty[]).find(
        property => property.name === TILED_AREA_METADATA_PROPERTY.FAINT_LOCATION,
      )?.value;

      // check to see if the level data we need to load is different and load that map to get player spawn data
      if (knockOutSpawnLocation !== this.#sceneData.area) {
        this.#sceneData.area = knockOutSpawnLocation;
        map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
      }

      // set players spawn location to that map and finds the revive location based on that object
      const reviveLocation = map.getObjectLayer('Revive-Location').objects[0];
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
        x: reviveLocation.x,
        y: reviveLocation.y - TILE_SIZE,
      });
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, DIRECTION.UP);
    }

    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_LOCATION, {
      area: this.#sceneData.area,
      isInterior: this.#sceneData.isInterior,
    } as PlayerLocation);

    this.#wildMonsterEncountered = false;
    this.#npcPlayerIsInteractingWith = undefined;
    this.#items = [];
    this.#lastNpcEventHandledIndex = -1;
    this.#isProcessingNpcEvent = false;
    this.#encounterLayers = [];
    this.#signLayer = undefined;
    this.#entranceLayer = undefined;
    this.#eventZones = {};
    this.#debugEventZoneObjects = {};
    this.#rectangleForOverlapCheck1 = undefined;
    this.#rectangleForOverlapCheck2 = undefined;
    this.#rectangleOverlapResult = undefined;
    this.#gfx = undefined;
    this.#currentCutSceneId = undefined;
    this.#isProcessingCutSceneEvent = false;
    this.#lastCutSceneEventHandledIndex = -1;
    this.#specialEncounterTileImageGameObjectGroup = undefined;
    this.#encounterZonePlayerIsEntering = undefined;
  }

  async create() {
    super.create();
    // create rectangles for checking for overlaps between game objects, added so we can recycle game objects
    this.#rectangleForOverlapCheck1 = new Phaser.Geom.Rectangle();
    this.#rectangleForOverlapCheck2 = new Phaser.Geom.Rectangle();
    this.#rectangleOverlapResult = new Phaser.Geom.Rectangle();
    // 使用walletUtils获取账户信息
    const currentAccount = walletUtils.getCurrentAccount();
    console.log('currentAccount', currentAccount);
    // create map and collision layer
    const map = this.make.tilemap({ key: `${this.#sceneData.area.toUpperCase()}_LEVEL` });
    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    const collisionTiles = map.addTilesetImage('collision', WORLD_ASSET_KEYS.WORLD_COLLISION);
    if (!collisionTiles) {
      console.log(`[${WorldScene.name}:create] encountered error while creating collision tiles from tiled`);
      return;
    }
    const collisionLayer = map.createLayer('Collision', collisionTiles, 0, 0);
    if (!collisionLayer) {
      console.log(`[${WorldScene.name}:create] encountered error while creating collision layer using data from tiled`);
      return;
    }
    collisionLayer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);

    // create interactive layer
    const hasSignLayer = map.getObjectLayer('Sign') !== null;
    if (hasSignLayer) {
      this.#signLayer = map.getObjectLayer('Sign');
    }

    // create layer for scene transitions entrances
    const hasSceneTransitionLayer = map.getObjectLayer('Scene-Transitions') !== null;
    if (hasSceneTransitionLayer) {
      this.#entranceLayer = map.getObjectLayer('Scene-Transitions');
    }

    // create collision layer for encounters
    this.#createEncounterAreas(map);

    const metadata = await loadMetadata(NETWORK, PACKAGE_ID);
    const dubhe = new Dubhe({
      networkType: NETWORK,
      packageId: PACKAGE_ID,
      metadata: metadata,
      indexerUrl: walletUtils.getIndexerUrl().http,
      indexerWsUrl: walletUtils.getIndexerUrl().ws,
    });

    this.dubhe = dubhe;
    this.schemaId = SCHEMA_ID;
    let have_player = await dubhe.getStorageItem({
      name: 'player',
      key1: walletUtils.getCurrentAccount().address,
    });

    if (have_player === undefined) {
      await this.registerNewPlayer(dubhe);
    }
    await this.subscribeToEvents(dubhe);

    // Check if in teleport state
    const isTeleporting = dataManager.store.get('IS_TELEPORTING');

    if (!isTeleporting) {
      await dataManager.updatePlayerPosition();
    } else {
      // Clear teleport state
      dataManager.store.set('IS_TELEPORTING', undefined);
    }

    if (!this.#sceneData.isInterior) {
      this.cameras.main.setBounds(0, 0, 1280, 2176);
    }
    this.cameras.main.setZoom(0.8);
    this.add.image(0, 0, `${this.#sceneData.area.toUpperCase()}_BACKGROUND`, 0).setOrigin(0);
    // create items and collisions
    this.#createItems(map);
    // create npcs
    this.#createNPCs(map);

    this.#player = new Player({
      scene: this,
      position: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION),
      direction: dataManager.store.get(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION),
      collisionLayer: collisionLayer,
      spriteGridMovementFinishedCallback: () => {
        this.#handlePlayerMovementUpdate();
      },
      spriteChangedDirectionCallback: () => {
        this.#handlePlayerDirectionUpdate();
      },
      otherCharactersToCheckForCollisionsWith: this.#npcs,
      objectsToCheckForCollisionsWith: this.#items,
      entranceLayer: this.#entranceLayer,
      enterEntranceCallback: async (entranceName, entranceId, isBuildingEntrance) => {
        await this.#handleEntranceEnteredCallback(entranceName, entranceId, isBuildingEntrance);
      },
      spriteGridMovementStartedCallback: position => {
        return this.#handlePlayerMovementStarted(position);
      },
      dubhe,
      schemaId: SCHEMA_ID,
    });
    this.cameras.main.startFollow(this.#player.sprite);

    // update our collisions with npcs
    this.#npcs.forEach(npc => {
      npc.addCharacterToCheckForCollisionsWith(this.#player);
    });

    // create foreground for depth
    this.add.image(0, 0, `${this.#sceneData.area.toUpperCase()}_FOREGROUND`, 0).setOrigin(0);

    // create menu
    this.#menu = new WorldMenu(this);

    // create event zones
    this.#createEventEncounterZones(map);

    if (ENABLE_ZONE_DEBUGGING) {
      // used for debugging the overlaps for event zones
      this.#gfx = this.add.graphics({ lineStyle: { width: 4, color: 0x00ffff } });
    }

    this.cameras.main.fadeIn(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        // if the player was knocked out, we want to lock input, heal player, and then have npc show message
        if (this.#sceneData.isPlayerKnockedOut) {
          this.#healPlayerParty();
          this.#dialogUi.showDialogModal([
            'It looks like your team put up quite a fight...',
            'I went ahead and healed them up for you.',
          ]);
        }
      }
    });
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.GAME_STARTED, true);

    // add audio
    playBackgroundMusic(this, AUDIO_ASSET_KEYS.MAIN);
    // add UI scene for cutscene and dialog
    this.scene.launch(SCENE_KEYS.CUTSCENE_SCENE);
    this.scene.launch(SCENE_KEYS.DIALOG_SCENE);

    // Check chat scene status to properly reuse or initialize it
    if (this.scene.isSleeping(SCENE_KEYS.CHAT_SCENE)) {
      // If scene is in sleep state, wake it up instead of recreating
      this.scene.wake(SCENE_KEYS.CHAT_SCENE);
      this.scene.bringToTop(SCENE_KEYS.CHAT_SCENE);
      this.#chatUi = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;
    } else if (this.scene.isActive(SCENE_KEYS.CHAT_SCENE)) {
      // If scene is already active, use it directly
      this.scene.bringToTop(SCENE_KEYS.CHAT_SCENE);
      this.#chatUi = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;
    } else {
      // Scene doesn't exist or isn't running, need to initialize it
      if (!this.game.scene.getScene(SCENE_KEYS.CHAT_SCENE)) {
        console.log('Adding Chat Scene to game');
        this.game.scene.add(SCENE_KEYS.CHAT_SCENE, ChatScene);
      }

      // Launch chat scene
      this.scene.launch(SCENE_KEYS.CHAT_SCENE);
      this.#chatUi = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;
      this.scene.bringToTop(SCENE_KEYS.CHAT_SCENE);
    }

    this.#dialogUi = this.scene.get(SCENE_KEYS.DIALOG_SCENE) as DialogScene;

    this.#specialEncounterTileImageGameObjectGroup = this.add.group({ classType: Phaser.GameObjects.Image });

    // const hasEncounter = await dataManager.hasEncounter();
    // if (hasEncounter) {
    await this.#handleEncounterCreation();
    // }
  }

  async update(time: DOMHighResTimeStamp) {
    if (!this.#player) {
      return;
    }

    super.update(time);

    if (this.#wildMonsterEncountered) {
      // If the player is encountering a monster, only update player state, don't process any input
      this.#player.update(time);
      return;
    }

    // Check chat interface status - if chat input is active, don't process world scene input
    const chatScene = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;
    if (chatScene && chatScene.isInputActive) {
      // Only update game objects, don't process input
      this.#player.update(time);
      this.#npcs.forEach(npc => {
        npc.update(time);
      });
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    const selectedDirectionHeldDown = this._controls.getDirectionKeyPressedDown();
    const selectedDirectionPressedOnce = this._controls.getDirectionKeyJustPressed();

    if (this.#isProcessingCutSceneEvent) {
      this.#player.update(time);
      this.#npcs.forEach(npc => {
        npc.update(time);
      });
      if (wasSpaceKeyPressed && this.#npcPlayerIsInteractingWith) {
        await this.#handlePlayerInteraction();
      }
      return;
    }

    if (selectedDirectionHeldDown !== DIRECTION.NONE && !this.#isPlayerInputLocked()) {
      await this.#player.moveCharacter(selectedDirectionHeldDown);
    }

    if (wasSpaceKeyPressed && !this.#player.isMoving && !this.#menu?.isVisible) {
      await this.#handlePlayerInteraction();
    }

    if (this._controls.wasEnterKeyPressed() && !this.#player.isMoving) {
      if (this.#dialogUi.isVisible || this.#isProcessingNpcEvent) {
        return;
      }

      if (this.#menu?.isVisible) {
        this.#menu.hide();
        return;
      }

      this.#menu.show();
    }

    if (this.#menu?.isVisible) {
      if (selectedDirectionPressedOnce !== DIRECTION.NONE) {
        this.#menu.handlePlayerInput(selectedDirectionPressedOnce);
      }

      if (wasSpaceKeyPressed) {
        this.#menu.handlePlayerInput('OK');

        if (this.#menu.selectedMenuOption === 'SAVE') {
          this.#menu.hide();
          dataManager.saveData();
          this.#dialogUi.showDialogModal(['Game progress has been saved']);
        }

        if (this.#menu.selectedMenuOption === 'MONSTERS') {
          // at start of the game, handle when we have no monsters in our party
          if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY).length === 0) {
            this.#dialogUi.showDialogModal(['You have no monsters in your party.']);
            this.#menu.hide();
            return;
          }

          // pause this scene and launch the monster party scene
          const sceneDataToPass: MonsterPartySceneData = {
            previousSceneName: SCENE_KEYS.WORLD_SCENE,
            isBattling: false,
          };
          this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
          this.scene.pause(SCENE_KEYS.WORLD_SCENE);
        }

        if (this.#menu.selectedMenuOption === 'BAG') {
          // pause this scene and launch the inventory scene
          const sceneDataToPass: InventorySceneData = {
            previousSceneName: SCENE_KEYS.WORLD_SCENE,
            isBattling: false,
          };
          this.scene.launch(SCENE_KEYS.INVENTORY_SCENE, sceneDataToPass);
          this.scene.pause(SCENE_KEYS.WORLD_SCENE);
        }

        if (this.#menu.selectedMenuOption === 'EXIT') {
          this.#menu.hide();
        }
      }

      if (this._controls.wasBackKeyPressed()) {
        this.#menu.hide();
      }
    }

    this.#player.update(time);

    this.#npcs.forEach(npc => {
      npc.update(time);
    });

    // Ensure chat scene stays in the foreground, but don't repeatedly launch it
    if (this.scene.isActive(SCENE_KEYS.CHAT_SCENE)) {
      this.scene.bringToTop(SCENE_KEYS.CHAT_SCENE);
    } else if (this.scene.isSleeping(SCENE_KEYS.CHAT_SCENE)) {
      this.scene.wake(SCENE_KEYS.CHAT_SCENE);
      this.scene.bringToTop(SCENE_KEYS.CHAT_SCENE);
    }
  }

  /**
   * Handles real-time game events through WebSocket subscription
   * @param dubhe - Dubhe client instance
   */
  async subscribeToEvents(dubhe: Dubhe) {
    try {
      // First check if there's an existing subscription, if so close it
      if (this.subscription) {
        try {
          this.subscription.close();
          console.log('Closed previous WebSocket subscription to prevent duplicate messages');
        } catch (closeError) {
          console.warn('Failed to close WebSocket subscription:', closeError);
        }
      }

      // Subscribe to multiple event types
      const sub = await dubhe.subscribe(
        [
          {
            kind: SubscriptionKind.Event,
            name: 'monster_catch_attempt',
            // sender: walletUtils.getCurrentAccount().address,
          },
          {
            kind: SubscriptionKind.Schema,
            name: 'position',
          },
          {
            kind: SubscriptionKind.Schema,
            name: 'monster',
          },
          {
            kind: SubscriptionKind.Schema,
            name: 'encounter',
          },
          {
            kind: SubscriptionKind.Schema,
            name: 'chat',
          },
          {
            kind: SubscriptionKind.Event,
            name: 'item_dropped',
            // sender: walletUtils.getCurrentAccount().address,
          },
        ],
        async data => {
          console.log('Received real-time data:', data);

          let chatSceneAvailable = false;
          if (!this.#chatUi) {
            try {
              this.#chatUi = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;
              if (!this.scene.isActive(SCENE_KEYS.CHAT_SCENE)) {
                this.scene.launch(SCENE_KEYS.CHAT_SCENE);
                // Give scene some time to initialize
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error) {
              console.error('Error initializing chat scene:', error);
            }
          }

          // Confirm ChatScene availability
          chatSceneAvailable =
            this.#chatUi && typeof this.#chatUi.addMessage === 'function' && this.scene.isActive(SCENE_KEYS.CHAT_SCENE);

          try {
            // Process various message types
            if (data.name === 'position') {
              const position = data.value;
              const playerAddress = data.key1;

              // Only show other players' movements
              if (playerAddress !== walletUtils.getCurrentAccount().address) {
                const shortAddress = `${playerAddress.substring(0, 6)}...`;
                // Don't show chat messages in battle mode
                if (chatSceneAvailable) {
                  this.#chatUi.addMessage(
                    `player ${shortAddress} moved to (${position.x}, ${position.y})`,
                    MessageType.OTHER,
                    shortAddress,
                  );
                }
              }
            } else if (data.name === 'monster') {
              // console.log('=========== subscribed to monster event, monsters', data);
              // Monster status updates are system messages, can show even during battle
              if (chatSceneAvailable) {
                this.#chatUi.addMessage('Monster status updated', MessageType.SYSTEM);
              }
              // } else if (data.name === 'encounter') {
              //   // Set battle mode flag when encounter happens
              //   if (!this.#wildMonsterEncountered) {
              //     this.#handleEncounterCreation();
              //     if (chatSceneAvailable) {
              //       this.#chatUi.addMessage('Encounter happened!', MessageType.SYSTEM);
              //     }
              //   }
            } else if (data.name === 'monster_catch_attempt') {
              const result = data.value.result;
              if (result) {
                const resultType = Object.keys(result)[0];
                let resultMessage = 'Unknown result';

                if (resultType === 'Caught') {
                  resultMessage = 'Caught successfully!';
                } else if (resultType === 'Missed') {
                  resultMessage = 'Catch failed!';
                } else if (resultType === 'Ran') {
                  resultMessage = 'Monster ran!';
                }

                // Catch results are battle-related system messages, can show
                if (chatSceneAvailable) {
                  this.#chatUi.addMessage(resultMessage, MessageType.SYSTEM);
                }
              }
            } else if (data.name === 'chat') {
              const message = data.value.message;
              const sender = data.key1;

              // Don't show chat messages in battle mode
              if (sender !== walletUtils.getCurrentAccount().address) {
                const shortAddress = `${sender.substring(0, 6)}...`;
                if (chatSceneAvailable) {
                  this.#chatUi.addMessage(message, MessageType.OTHER, shortAddress);
                }
              }
            } else if (data.name === 'item_dropped') {
              try {
                const itemId = data.value.item_id;
                const quantities = data.value.quantities;

                // Item metadata might be async, wrap in try-catch
                let itemName = itemId;
                try {
                  const itemMetadata = await dataManager.getItemMetadata(itemId);
                  if (itemMetadata && itemMetadata.name) {
                    itemName = itemMetadata.name;
                  }
                } catch (err) {
                  console.error('Error getting item metadata:', err);
                }

                const message = `Dropped ${quantities} ${itemName}`;
                // Item drops are game system messages, can show
                if (chatSceneAvailable) {
                  this.#chatUi.addMessage(message, MessageType.ITEM);
                }
              } catch (itemError) {
                console.error('Error processing item_dropped event:', itemError);
              }
            }
          } catch (messageError) {
            console.error('Error processing subscription message:', messageError);
          }
        },
      );

      this.subscription = sub;
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
    }
  }

  /**
   * Registers a new player in the game
   * @param dubhe - Dubhe client instance
   */
  registerNewPlayer = async (dubhe: Dubhe) => {
    try {
      const registerTx = new Transaction();
      const params = [
        registerTx.object(this._dubheSchemaId),
        registerTx.object(SCHEMA_ID),
        registerTx.pure.u64(0),
        registerTx.pure.u64(4),
        registerTx.pure.u64(21),
      ];
      registerTx.setGasBudget(100000000);
      await dubhe.tx.numeron_map_system.register({
        tx: registerTx,
        params,
        isRaw: true,
      });
      await walletUtils.signAndExecuteTransaction({
        tx: registerTx,
        onSuccess: async result => {
          await dubhe.waitForIndexerTransaction(result.digest);
        },
        onError: error => {
          console.error('Failed to register player:', error);
        },
      });
    } catch (error) {
      console.error('Register player error:', error);
      throw error;
    }
  };

  async #handlePlayerInteraction() {
    if (this.#dialogUi.isAnimationPlaying) {
      return;
    }

    if (this.#dialogUi.isVisible && !this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.hideDialogModal();
      if (this.#currentCutSceneId !== undefined) {
        this.#isProcessingCutSceneEvent = false;
        this.#handleCutSceneInteraction();
      }
      if (this.#npcPlayerIsInteractingWith) {
        this.#handleNpcInteraction();
      }
      return;
    }

    if (this.#dialogUi.isVisible && this.#dialogUi.moreMessagesToShow) {
      this.#dialogUi.showNextMessage();
      return;
    }

    // get players current direction and check 1 tile over in that direction to see if there is an object that can be interacted with
    const { x, y } = this.#player.sprite;
    const targetPosition = getTargetPositionFromGameObjectPositionAndDirection({ x, y }, this.#player.direction);

    // check for sign, and display appropriate message if player is not facing up
    const nearbySign = this.#signLayer?.objects.find(object => {
      if (!object.x || !object.y) {
        return false;
      }

      // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
      return object.x === targetPosition.x && object.y - TILE_SIZE === targetPosition.y;
    });

    if (nearbySign) {
      const props: TiledObjectProperty[] = nearbySign.properties;
      const msg: string = props.find(prop => prop.name === TILED_SIGN_PROPERTY.MESSAGE)?.value;

      const usePlaceholderText = this.#player.direction !== DIRECTION.UP;
      let textToShow = CANNOT_READ_SIGN_TEXT;
      if (!usePlaceholderText) {
        textToShow = msg || SAMPLE_TEXT;
      }
      this.#dialogUi.showDialogModal([textToShow]);
      return;
    }

    const nearbyNpc = this.#npcs.find(npc => {
      return npc.sprite.x === targetPosition.x && npc.sprite.y === targetPosition.y;
    });
    if (nearbyNpc) {
      nearbyNpc.facePlayer(this.#player.direction);
      nearbyNpc.isTalkingToPlayer = true;
      this.#npcPlayerIsInteractingWith = nearbyNpc;
      this.#handleNpcInteraction();
      return;
    }

    // check for a nearby item and display message about player finding the item
    let nearbyItemIndex: number | undefined;
    const nearbyItem = this.#items.find((item, index) => {
      if (item.position.x === targetPosition.x && item.position.y === targetPosition.y) {
        nearbyItemIndex = index;
        return true;
      }
      return false;
    });
    if (nearbyItem) {
      // add item to inventory and display message to player
      const item = await dataManager.getItemMetadata(nearbyItem.itemId);
      dataManager.addItem(item, 1);
      nearbyItem.gameObject.destroy();
      this.#items.splice(nearbyItemIndex, 1);
      dataManager.addItemPickedUp(nearbyItem.id);
      this.#dialogUi.showDialogModal([`You found a ${item.name}`]);
    }
  }

  #handlePlayerMovementUpdate() {
    // update player position on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
      x: this.#player.sprite.x,
      y: this.#player.sprite.y,
    });

    // check to see if the player encountered cut scene zone
    this.#player.sprite.getBounds(this.#rectangleForOverlapCheck1);
    for (const zone of Object.values(this.#eventZones)) {
      // get the bounds of the player and zone for checking for overlap
      zone.getBounds(this.#rectangleForOverlapCheck2);

      // reset rectangle overlap size, needed since method below will
      // return the original rectangle unmodified if a previous match
      // was found.
      this.#rectangleOverlapResult.setSize(0, 0);
      Phaser.Geom.Intersects.GetRectangleIntersection(
        this.#rectangleForOverlapCheck1,
        this.#rectangleForOverlapCheck2,
        this.#rectangleOverlapResult,
      );

      if (ENABLE_ZONE_DEBUGGING) {
        // for debugging the overlap checks for the events
        this.#gfx.clear();
        this.#gfx.strokeRectShape(this.#rectangleOverlapResult);
      }

      const isOverlapping =
        this.#rectangleOverlapResult.width >= TILE_SIZE - 10 && this.#rectangleOverlapResult.height >= TILE_SIZE - 10;

      if (isOverlapping) {
        const eventId = parseInt(zone.name, 10);
        const eventData = DataUtils.getEventData(this, eventId);
        const currentGameFlags = dataManager.getFlags();
        const eventRequirementsMet = eventData.requires.every(flag => {
          return currentGameFlags.has(flag);
        });
        if (eventRequirementsMet) {
          this.#currentCutSceneId = parseInt(zone.name, 10);
          this.#startCutScene();
          break;
        }
      }
    }
    if (this.#currentCutSceneId !== undefined) {
      return;
    }
    if (this.#encounterLayers.length === 0) {
      return;
    }
    this.#handlePlayerMovementInEncounterZone();
  }

  async #handlePlayerMovementInEncounterZone() {
    // 如果已经遇到怪兽，直接返回，禁止处理移动
    if (this.#wildMonsterEncountered) {
      return;
    }

    // cleanup any special tiles that are not at the players current position
    if (
      this.#specialEncounterTileImageGameObjectGroup &&
      this.#specialEncounterTileImageGameObjectGroup.getChildren &&
      typeof this.#specialEncounterTileImageGameObjectGroup.getChildren === 'function'
    ) {
      try {
        const children = this.#specialEncounterTileImageGameObjectGroup.getChildren();
        if (Array.isArray(children)) {
          children.forEach((child: Phaser.GameObjects.Image) => {
            if (!child || !child.active) {
              return;
            }
            if (child.x === this.#player.sprite.x && child.y === this.#player.sprite.y) {
              child.visible = true;
              return;
            }
            child.active = false;
            child.visible = false;
          });
        }
      } catch (error) {
        console.error('处理特殊遭遇区域图块时出错:', error);
      }
    }

    if (this.#encounterZonePlayerIsEntering === undefined) {
      return;
    }

    console.log(`[${WorldScene.name}:handlePlayerMovementInEncounterZone] player is in an encounter zone`);

    // 检查是否已经锁定输入或者已经进入战斗状态
    if (this._controls.isInputLocked || this.#wildMonsterEncountered) {
      return;
    }

    // const hasEncounter = await dataManager.hasEncounter();
    // if (hasEncounter) {
    //   console.log(`[${WorldScene.name}:handlePlayerMovementInEncounterZone] player has encountered a wild monster`);
    await this.#handleEncounterCreation();
    // }
    // this.#wildMonsterEncountered = Math.random() < 0.2;

    // if (wildMonsterEncountered) {

    // }
  }

  async #handleEncounterCreation() {
    try {
      if (this.#wildMonsterEncountered) {
        return;
      }

      // 立即锁定玩家输入，防止在转场动画期间移动
      this._controls.lockInput = true;
      this.#wildMonsterEncountered = true;

      // const encounterAreaId = (this.#encounterZonePlayerIsEntering.layer.properties as TiledObjectProperty[]).find(
      //   property => property.name === TILED_ENCOUNTER_PROPERTY.AREA,
      // ).value;
      // const possibleMonsters = DataUtils.getEncounterAreaDetails(this, encounterAreaId);
      // const randomMonsterId = weightedRandom(possibleMonsters);
      // TO GET ENCONTER MONSTER ON CHAIN
      const enemyMonsters = await dataManager.getEncounterMonster();
      if (!enemyMonsters) {
        console.log(`[${WorldScene.name}:handleEncounterCreation] no enemy monsters found`);
        // 如果没有找到怪兽，解除锁定
        this._controls.lockInput = false;
        this.#wildMonsterEncountered = false;
        return;
      }

      console.log(`[${WorldScene.name}:handleEncounterCreation] player has encountered a wild monster`);

      // 检查cameras.main是否存在，防止出现"Cannot read properties of undefined"错误
      if (!this.cameras || !this.cameras.main) {
        console.log(`[${WorldScene.name}:handleEncounterCreation] cameras.main is undefined, skipping fade out`);
        const dataToPass: BattleSceneData = {
          enemyMonsters: [enemyMonsters.monster],
          playerMonsters: dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY),
          playerMonsterId: enemyMonsters.playerMonsterId,
        };
        this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
        return;
      }

      this.cameras.main.fadeOut(2000);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        const dataToPass: BattleSceneData = {
          enemyMonsters: [enemyMonsters.monster],
          playerMonsters: dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY),
          playerMonsterId: enemyMonsters.playerMonsterId,
        };

        this.scene.start(SCENE_KEYS.BATTLE_SCENE, dataToPass);
      });
    } catch (error) {
      console.error(`[${WorldScene.name}:handleEncounterCreation] 处理遭遇战创建时出错:`, error);
      // 如果错误是已经在遭遇战中，这是预期的，不需要额外处理
      if (error.toString().includes('already_in_encounter_error')) {
        console.log(`[${WorldScene.name}:handleEncounterCreation] 玩家已经处于遭遇战中，忽略此错误`);
      }
      // 不抛出错误，允许游戏继续运行
      // 出错时也要保持锁定状态
      this._controls.lockInput = true;
      this.#wildMonsterEncountered = true;
    }
  }

  #isPlayerInputLocked(): boolean {
    return (
      this._controls.isInputLocked ||
      this.#dialogUi.isVisible ||
      this.#menu?.isVisible ||
      this.#isProcessingNpcEvent ||
      this.#currentCutSceneId !== undefined
    );
  }

  #createNPCs(map: Phaser.Tilemaps.Tilemap) {
    this.#npcs = [];

    const npcLayers = map.getObjectLayerNames().filter(layerName => layerName.includes('NPC'));
    npcLayers.forEach(layerName => {
      const layer = map.getObjectLayer(layerName);
      const npcObject = layer.objects.find(obj => {
        return obj.type === CUSTOM_TILED_TYPES.NPC;
      });
      if (!npcObject || npcObject.x === undefined || npcObject.y === undefined) {
        return;
      }

      // get the path objects for this npc
      const pathObjects = layer.objects.filter(obj => {
        return obj.type === CUSTOM_TILED_TYPES.NPC_PATH;
      });
      const npcPath: NPCPath = {
        0: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
      };
      pathObjects.forEach(obj => {
        if (obj.x === undefined || obj.y === undefined) {
          return;
        }
        npcPath[parseInt(obj.name, 10)] = { x: obj.x, y: obj.y - TILE_SIZE };
      });

      const npcMovement: NpcMovementPattern =
        (npcObject.properties as TiledObjectProperty[]).find(
          property => property.name === TILED_NPC_PROPERTY.MOVEMENT_PATTERN,
        )?.value || 'IDLE';

      const npcId: number = (npcObject.properties as TiledObjectProperty[]).find(
        property => property.name === TILED_NPC_PROPERTY.ID,
      )?.value;
      const npcDetails = DataUtils.getNpcData(this, npcId);

      // In Tiled, the x value is how far the object starts from the left, and the y is the bottom of tiled object that is being added
      const npc = new NPC({
        scene: this,
        position: { x: npcObject.x, y: npcObject.y - TILE_SIZE },
        direction: DIRECTION.DOWN,
        frame: npcDetails.frame,
        npcPath,
        movementPattern: npcMovement,
        events: npcDetails.events,
        animationKeyPrefix: npcDetails.animationKeyPrefix,
        id: npcId,
      });
      this.#npcs.push(npc);
    });
  }

  #handlePlayerDirectionUpdate() {
    // update player direction on global data store
    dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_DIRECTION, this.#player.direction);
  }

  async #healPlayerParty() {
    await dataManager.updateMonsters();

    // heal all monsters in party
    // const monsters: Monster[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    // monsters.forEach(monster => {
    //   monster.currentHp = monster.maxHp;
    // });
    // dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, monsters);
  }

  #createItems(map: Phaser.Tilemaps.Tilemap) {
    const itemObjectLayer = map.getObjectLayer('Item');
    if (!itemObjectLayer) {
      return;
    }
    const items = itemObjectLayer.objects;
    const validItems = items.filter(item => {
      return item.x !== undefined && item.y !== undefined;
    });

    const itemsPickedUp: number[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.ITEMS_PICKED_UP) || [];

    for (const tiledItem of validItems) {
      const itemId: number = (tiledItem.properties as TiledObjectProperty[]).find(
        property => property.name === TILED_ITEM_PROPERTY.ITEM_ID,
      )?.value;

      const id: number = (tiledItem.properties as TiledObjectProperty[]).find(
        property => property.name === TILED_ITEM_PROPERTY.ID,
      )?.value;

      if (itemsPickedUp.includes(id)) {
        continue;
      }

      // create object
      const item = new Item({
        scene: this,
        position: {
          x: tiledItem.x,
          y: tiledItem.y - TILE_SIZE,
        },
        itemId,
        id,
      });
      this.#items.push(item);
    }
  }
  async #handleEntranceEnteredCallback(entranceName: string, entranceId: string, isBuildingEntrance: boolean) {
    // Get player's monsters and check if they all have no HP
    const playerMonsters: Monster[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    // If there are monsters and all of them have no HP, don't allow teleporting
    const allMonstersNoHp = playerMonsters.length > 0 && playerMonsters.every(monster => monster.currentHp <= 0);

    if (allMonstersNoHp) {
      this.#dialogUi.showDialogModal([
        'Your monsters have all lost their fighting ability...',
        'Please heal your monsters before trying to teleport.',
      ]);
      return;
    }

    if (playerMonsters.length === 0) {
      this.#dialogUi.showDialogModal([
        'You have no monsters in your party...',
        'Please claim monster to your party before trying to teleport.',
      ]);
      return;
    }

    try {
      this._controls.lockInput = true;

      // 创建交易
      const tx = new Transaction();
      await this.dubhe.tx.numeron_map_system.teleport({
        tx,
        params: [tx.object(this._dubheSchemaId), tx.object(this.schemaId)],
        isRaw: true,
      });

      // 先等待交易完成
      await walletUtils.signAndExecuteTransaction({
        tx,
        onSuccess: async (result: any) => {
          console.log(`Teleport transaction successful:`, result);

          // 交易完成后再进行场景切换
          await new Promise<void>(resolve => {
            this.cameras.main.fadeOut(1200, 0, 0, 0, async (camera, progress) => {
              if (progress === 1) {
                // 获取地图和入口数据
                const map = this.make.tilemap({ key: `${entranceName.toUpperCase()}_LEVEL` });
                const entranceObjectLayer = map.getObjectLayer('Scene-Transitions');
                const entranceObject = entranceObjectLayer.objects.find(object => {
                  const tempEntranceName = object.properties.find(property => property.name === 'connects_to').value;
                  const tempEntranceId = object.properties.find(property => property.name === 'entrance_id').value;
                  return tempEntranceName === this.#sceneData.area && tempEntranceId === entranceId;
                });
                await this.dubhe.waitForIndexerTransaction(result.digest);

                // 计算新位置
                let newX = entranceObject.x;
                let newY = entranceObject.y - TILE_SIZE;
                if (this.#player.direction === DIRECTION.UP) {
                  newY -= TILE_SIZE;
                }
                if (this.#player.direction === DIRECTION.DOWN) {
                  newY += TILE_SIZE;
                }

                console.log(`[${WorldScene.name}:handleEntranceEnteredCallback] setting player position to`, {
                  x: newX,
                  y: newY,
                });

                // 存储新位置
                dataManager.store.set(DATA_MANAGER_STORE_KEYS.PLAYER_POSITION, {
                  x: newX,
                  y: newY,
                });

                // 添加一个标记表示正在传送中
                dataManager.store.set('IS_TELEPORTING', true);

                const dataToPass: WorldSceneData = {
                  area: entranceName,
                  isInterior: isBuildingEntrance,
                };

                // 在启动新场景前保持聊天场景状态，避免重新初始化
                if (this.scene.isActive(SCENE_KEYS.CHAT_SCENE)) {
                  this.scene.sleep(SCENE_KEYS.CHAT_SCENE);
                }

                this.scene.start(SCENE_KEYS.WORLD_SCENE, dataToPass);
                resolve();
              }
            });
          });
        },
        onError: (error: any) => {
          console.error(`Teleport transaction failed:`, error);
          this._controls.lockInput = false;
          throw error;
        },
      });
    } catch (error) {
      console.error('Teleport failed:', error);
      this._controls.lockInput = false;
      throw error;
    }
  }

  #handleNpcInteraction() {
    if (this.#isProcessingNpcEvent) {
      return;
    }

    // check to see if the npc has any events associated with them
    const isMoreEventsToProcess = this.#npcPlayerIsInteractingWith.events.length - 1 !== this.#lastNpcEventHandledIndex;

    if (!isMoreEventsToProcess) {
      this.#npcPlayerIsInteractingWith.isTalkingToPlayer = false;
      this.#npcPlayerIsInteractingWith = undefined;
      this.#lastNpcEventHandledIndex = -1;
      this.#isProcessingNpcEvent = false;
      return;
    }

    // get the next event from the queue and process for this npc
    this.#lastNpcEventHandledIndex += 1;
    const eventToHandle = this.#npcPlayerIsInteractingWith.events[this.#lastNpcEventHandledIndex];
    const eventType = eventToHandle.type;

    // check to see if this event should be handled based on story flags
    const currentGameFlags = dataManager.getFlags();
    const eventRequirementsMet = eventToHandle.requires.every(flag => {
      if (flag.startsWith('!')) {
        const actualFlag = flag.substring(1);
        return !currentGameFlags.has(actualFlag);
      }
      return currentGameFlags.has(flag);
    });

    if (!eventRequirementsMet) {
      // jump to next event
      this.#handleNpcInteraction();
      return;
    }

    switch (eventType) {
      case NPC_EVENT_TYPE.MESSAGE:
        this.#dialogUi.showDialogModal(eventToHandle.data.messages);
        break;
      case NPC_EVENT_TYPE.HEAL:
        this.#isProcessingNpcEvent = true;
        this.#healPlayerParty();
        this.#isProcessingNpcEvent = false;
        this.#handleNpcInteraction();
        break;
      case NPC_EVENT_TYPE.SCENE_FADE_IN_AND_OUT:
        this.#isProcessingNpcEvent = true;
        // lock input, and wait for scene to fade in and out
        this.cameras.main.fadeOut(eventToHandle.data.fadeOutDuration, 0, 0, 0, (fadeOutCamera, fadeOutProgress) => {
          if (fadeOutProgress !== 1) {
            return;
          }
          this.time.delayedCall(eventToHandle.data.waitDuration, () => {
            this.cameras.main.fadeIn(eventToHandle.data.fadeInDuration, 0, 0, 0, (fadeInCamera, fadeInProgress) => {
              if (fadeInProgress !== 1) {
                return;
              }
              this.#isProcessingNpcEvent = false;
              this.#handleNpcInteraction();
            });
          });
        });
        // TODO: play audio cue
        break;
      default:
        exhaustiveGuard(eventType);
    }
  }

  /**
   * Creates the Phaser Zone game objects based on the `Events` tilemap data from the Tiled Map.
   * These game objects are used for creating the various in game events and cut scenes for the game.
   * The Zone game objects allow for us to check for overlaps between the player and the area that
   * is defined in the map data.
   */
  #createEventEncounterZones(map: Phaser.Tilemaps.Tilemap) {
    const eventObjectLayer = map.getObjectLayer('Events');
    if (!eventObjectLayer) {
      return;
    }
    const events = eventObjectLayer.objects;
    const validEvents = events.filter(event => {
      return event.x !== undefined && event.y !== undefined;
    });

    const playerMonsters: Monster[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);

    if (playerMonsters.length === 0) {
      dataManager.store.set(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS, []);
    }

    const viewedEvents: string[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.VIEWED_EVENTS);
    for (const tiledEvent of validEvents) {
      const eventId: string = (tiledEvent.properties as TiledObjectProperty[]).find(
        property => property.name === TILED_EVENT_PROPERTY.ID,
      )?.value;
      if (viewedEvents.includes(eventId)) {
        continue;
      }

      const eventZone = this.add
        .zone(tiledEvent.x, tiledEvent.y - TILE_SIZE * 2, tiledEvent.width, tiledEvent.height)
        .setOrigin(0)
        .setName(eventId);
      this.#eventZones[eventId] = eventZone;

      if (ENABLE_ZONE_DEBUGGING) {
        const debugZoneRectangle = this.add
          .rectangle(eventZone.x, eventZone.y, eventZone.width, eventZone.height, 0xff0000, 0.5)
          .setOrigin(0);
        this.#debugEventZoneObjects[eventId] = debugZoneRectangle;
      }
    }
  }

  async #startCutScene() {
    this.#isProcessingCutSceneEvent = true;
    await (this.scene.get(SCENE_KEYS.CUTSCENE_SCENE) as CutsceneScene).startCutScene();
    await sleep(500, this);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  async #handleCutSceneInteraction() {
    if (this.#isProcessingCutSceneEvent) {
      return;
    }
    if (this.#currentCutSceneId === undefined) {
      return;
    }

    const eventsToProcess = DataUtils.getEventData(this, this.#currentCutSceneId);

    // check to see if the cut scene has any more events to be processed
    const isMoreEventsToProcess = eventsToProcess.events.length - 1 !== this.#lastCutSceneEventHandledIndex;
    if (!isMoreEventsToProcess) {
      // once we are done processing the events for the cutscene, we need to do the following:
      //   1. update our data manager to show we watched the event
      //   2. cleanup zone game object used for the event and overlap detection
      //   3. reset our current cut scene property
      //   4. remove the cut scene bars from the scene
      this.#lastCutSceneEventHandledIndex = -1;
      this.#isProcessingCutSceneEvent = false;
      dataManager.viewedEvent(this.#currentCutSceneId);
      this.#eventZones[this.#currentCutSceneId].destroy();
      delete this.#eventZones[this.#currentCutSceneId];
      if (ENABLE_ZONE_DEBUGGING) {
        this.#gfx.clear();
        this.#debugEventZoneObjects[this.#currentCutSceneId].destroy();
        delete this.#debugEventZoneObjects[this.#currentCutSceneId];
      }
      this.#currentCutSceneId = undefined;

      await (this.scene.get(SCENE_KEYS.CUTSCENE_SCENE) as CutsceneScene).endCutScene();
      await sleep(500, this);
      return;
    }

    // get the next event from the queue and process for this npc
    this.#lastCutSceneEventHandledIndex += 1;
    const eventToHandle = eventsToProcess.events[this.#lastCutSceneEventHandledIndex];
    const eventType = eventToHandle.type;
    const monstersInParty = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    this.#isProcessingCutSceneEvent = true;
    switch (eventType) {
      case GAME_EVENT_TYPE.ADD_NPC:
        this.#createNpcForCutScene(eventToHandle);
        break;
      case GAME_EVENT_TYPE.MOVE_TO_PLAYER:
        this.#moveNpcToPlayer(eventToHandle);
        break;
      case GAME_EVENT_TYPE.RETRACE_PATH:
        this.#haveNpcRetracePath(eventToHandle);
        break;
      case GAME_EVENT_TYPE.REMOVE_NPC:
        this.#removeNpcForCutScene(eventToHandle);
        break;
      case GAME_EVENT_TYPE.TALK_TO_PLAYER:
        // if (monstersInParty.length === 0) {
        this.#haveNpcTalkToPlayer(eventToHandle);
        // } else {
        //   console.log('You already talked to your mom');
        // }
        break;
      case GAME_EVENT_TYPE.GIVE_MONSTER:
        // if (monstersInParty.length === 0) {
        this.#addMonsterFromNpc(eventToHandle);
        // } else {
        //   console.log('You already have a monster in your party');
        // }
        break;
      case GAME_EVENT_TYPE.ADD_FLAG:
        this.#addGameFlag(eventToHandle);
        break;
      case GAME_EVENT_TYPE.REMOVE_FLAG:
        this.#removeGameFlag(eventToHandle);
        break;
      default:
        exhaustiveGuard(eventType);
    }
  }

  #createNpcForCutScene(gameEvent: GameEventAddNpc) {
    const npc = new NPC({
      scene: this,
      position: { x: gameEvent.data.x * TILE_SIZE, y: gameEvent.data.y * TILE_SIZE },
      direction: gameEvent.data.direction,
      frame: gameEvent.data.frame,
      npcPath: {
        0: { x: gameEvent.data.x * TILE_SIZE, y: gameEvent.data.y * TILE_SIZE },
      },
      movementPattern: NPC_MOVEMENT_PATTERN.IDLE,
      events: [],
      animationKeyPrefix: gameEvent.data.animationKeyPrefix,
      id: gameEvent.data.id,
    });
    this.#npcs.push(npc);
    npc.addCharacterToCheckForCollisionsWith(this.#player);

    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  async #moveNpcToPlayer(gameEvent: GameEventMoveToPlayer) {
    const targetNpc = this.#npcs.find(npc => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // determine direction to move based on distance from player
    const targetPath = getTargetPathToGameObject(targetNpc.sprite, this.#player.sprite);
    const pathToFollow = targetPath.pathToFollow.splice(0, targetPath.pathToFollow.length - 1);

    // if npc is already next to player, just update directions
    if (pathToFollow.length === 0) {
      await this.#player.moveCharacter(getTargetDirectionFromGameObjectPosition(this.#player.sprite, targetNpc.sprite));
      targetNpc.facePlayer(this.#player.direction);
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // move npc according to the path
    const npcPath: NPCPath = {
      0: { x: targetNpc.sprite.x, y: targetNpc.sprite.y },
    };
    pathToFollow.forEach((coordinate, index) => {
      npcPath[index + 1] = coordinate;
    });

    targetNpc.finishedMovementCallback = async () => {
      if (
        pathToFollow[pathToFollow.length - 1].x === targetNpc.sprite.x &&
        pathToFollow[pathToFollow.length - 1].y === targetNpc.sprite.y
      ) {
        await this.#player.moveCharacter(
          getTargetDirectionFromGameObjectPosition(this.#player.sprite, targetNpc.sprite),
        );
        targetNpc.facePlayer(this.#player.direction);
        this.time.delayedCall(500, () => {
          this.#isProcessingCutSceneEvent = false;
          this.#handleCutSceneInteraction();
        });
      }
    };
    targetNpc.npcMovementPattern = NPC_MOVEMENT_PATTERN.SET_PATH;
    targetNpc.npcPath = npcPath;
    targetNpc.resetMovementTime();
  }

  #haveNpcRetracePath(gameEvent: GameEventRetracePath) {
    const targetNpc = this.#npcs.find(npc => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    // have npc retrace their steps by reversing the existing npc path
    const updatedPath: NPCPath = {};
    const pathKeys = Object.keys(targetNpc.npcPath).reverse();

    pathKeys.forEach((pathKey, index) => {
      updatedPath[index] = targetNpc.npcPath[pathKey];
    });

    // if npc is already next to player, there will be only 1 position in the npc path
    // when this happens, we need to just updates the npcs direction
    if (pathKeys.length === 1) {
      targetNpc.facePlayer(gameEvent.data.direction);
      this.time.delayedCall(500, () => {
        this.#isProcessingCutSceneEvent = false;
        this.#handleCutSceneInteraction();
      });
      return;
    }

    targetNpc.finishedMovementCallback = () => {
      if (
        updatedPath[pathKeys.length - 1].x === targetNpc.sprite.x &&
        updatedPath[pathKeys.length - 1].y === targetNpc.sprite.y
      ) {
        this.time.delayedCall(500, () => {
          this.#isProcessingCutSceneEvent = false;
          this.#handleCutSceneInteraction();
        });
      }
    };

    targetNpc.npcMovementPattern = NPC_MOVEMENT_PATTERN.SET_PATH;
    targetNpc.npcPath = updatedPath;
    targetNpc.resetMovementTime();
  }

  #removeNpcForCutScene(gameEvent: GameEventRemoveNpc) {
    // once we are done with an npc for a cutscene, we can remove that npc
    // from our npc array and then start the cleanup process of destroying the game object
    const npcToRemoveIndex = this.#npcs.findIndex(npc => npc.id === gameEvent.data.id);
    let npcToRemove: NPC | undefined;
    if (npcToRemoveIndex !== -1) {
      npcToRemove = this.#npcs.splice(npcToRemoveIndex)[0];
    }
    this.time.delayedCall(100, () => {
      if (npcToRemove !== undefined) {
        npcToRemove.sprite.destroy();
      }
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
    });
  }

  #haveNpcTalkToPlayer(gameEvent: GameEventTalkToPlayer) {
    const targetNpc = this.#npcs.find(npc => npc.id === gameEvent.data.id);
    if (targetNpc === undefined) {
      this.#isProcessingCutSceneEvent = false;
      this.#handleCutSceneInteraction();
      return;
    }

    targetNpc.isTalkingToPlayer = true;
    this.#npcPlayerIsInteractingWith = targetNpc;
    this.#dialogUi.showDialogModal(gameEvent.data.messages);
  }

  async #addMonsterFromNpc(gameEvent: GameEventGiveMonster) {
    // TODO: add check to see if party is full and do something with 7th monster that is being added
    if (dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY).length === 0) {
      console.log('Adding monster to party');
      const tx = new Transaction();
      await this.dubhe.tx.numeron_monster_system.claim_monster({
        tx,
        params: [tx.object(DUBHE_SCHEMA_ID), tx.object(this.schemaId)],
        isRaw: true,
      });
      await walletUtils.signAndExecuteTransaction({
        tx,
        onSuccess: async (result: any) => {
          console.log(`Transaction successful:`, result);
          await this.dubhe.waitForIndexerTransaction(result.digest);
          await dataManager.updateMonsters();
        },
        onError: (error: any) => {
          console.error(`Transaction failed:`, error);
        },
      });
    } else {
      console.log('You already have a monster in your party');
    }

    // const monstersInParty: Monster[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
    // const newMonster = DataUtils.getMonsterById(this, gameEvent.data.id);
    // monstersInParty.push(newMonster);
    // dataManager.store.set(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY, monstersInParty);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  #addGameFlag(gameEvent: GameEventAddFlag) {
    dataManager.addFlag(gameEvent.data.flag);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  #removeGameFlag(gameEvent: GameEventRemoveFlag) {
    dataManager.removeFlag(gameEvent.data.flag);
    this.#isProcessingCutSceneEvent = false;
    this.#handleCutSceneInteraction();
  }

  #createEncounterAreas(map: Phaser.Tilemaps.Tilemap) {
    const encounterLayers = map.getTileLayerNames().filter(layerName => layerName.includes('Encounter'));
    if (encounterLayers.length > 0) {
      const encounterTiles = map.addTilesetImage('encounter', WORLD_ASSET_KEYS.WORLD_ENCOUNTER_ZONE);
      if (!encounterTiles) {
        console.log(`[${WorldScene.name}:create] encountered error while creating encounter tiles from tiled`);
        return;
      }

      encounterLayers.forEach(layerName => {
        const layer = map.createLayer(layerName, encounterTiles, 0, 0);
        layer.setAlpha(TILED_COLLISION_LAYER_ALPHA).setDepth(2);
        this.#encounterLayers.push(layer);
      });
    }
  }

  #handlePlayerMovementStarted(position: Coordinate) {
    this.#encounterZonePlayerIsEntering = undefined;

    let encounterTile;
    let isEnteringEncounter = false;
    this.#encounterLayers.some(encounterLayer => {
      encounterTile = encounterLayer.getTileAtWorldXY(position.x, position.y, true);
      if (encounterTile.index !== -1) {
        this.#encounterZonePlayerIsEntering = encounterLayer;
        isEnteringEncounter = true;
        return true;
      }
      return false;
    });

    // 只在"刚进入草丛"时做宠物检查
    if (isEnteringEncounter) {
      const playerMonsters: Monster[] = dataManager.store.get(DATA_MANAGER_STORE_KEYS.MONSTERS_IN_PARTY);
      if (playerMonsters.length === 0) {
        this.#dialogUi.showDialogModal([
          "You don't have any monsters...",
          'Please obtain a monster before entering the grass.',
        ]);
        this.#encounterZonePlayerIsEntering = undefined;
        return false;
      }
      const allMonstersNoHp = playerMonsters.every(monster => monster.currentHp <= 0);
      if (allMonstersNoHp) {
        this.#dialogUi.showDialogModal([
          'All your monsters have lost their fighting ability...',
          'Please heal your monsters before entering the grass.',
        ]);
        this.#encounterZonePlayerIsEntering = undefined;
        return false;
      }
    }

    if (this.#encounterZonePlayerIsEntering === undefined) {
      if (this.#player.direction === DIRECTION.DOWN) {
        // if player is moving in the down direction, hide current tile so player does not move under it
        this.#hideSpecialEncounterTiles();
      }
      return;
    }

    console.log(`[${WorldScene.name}:handlePlayerMovementStarted] player is moving to an encounter zone`);
    // check the tile type for the encounter the player is moving through and play related effects
    this.#handleEncounterTileTypeEffects(this.#encounterZonePlayerIsEntering, encounterTile, this.#player.direction);
  }

  /**
   * Plays the associated special effects when player is about to move through a particular tile type.
   * Example, when moving through the grass, we play a sound effect and show an additional
   * game object to make it look like the player is moving through the grass.
   */
  #handleEncounterTileTypeEffects(
    encounterLayer: Phaser.Tilemaps.TilemapLayer,
    encounterTile: Phaser.Tilemaps.Tile,
    playerDirection: Direction,
  ) {
    const encounterTileType: EncounterTileType = (encounterLayer.layer.properties as TiledObjectProperty[]).find(
      property => property.name === TILED_ENCOUNTER_PROPERTY.TILE_TYPE,
    ).value;

    switch (encounterTileType) {
      case ENCOUNTER_TILE_TYPE.GRASS:
        // create grass sprite for when player moves through grass
        const object: Phaser.GameObjects.Image = this.#specialEncounterTileImageGameObjectGroup
          .getFirstDead(true, encounterTile.pixelX, encounterTile.pixelY, WORLD_ASSET_KEYS.GRASS, 1, true)
          .setOrigin(0)
          .setVisible(true)
          .setActive(true);
        if (playerDirection === DIRECTION.DOWN || playerDirection === DIRECTION.UP) {
          object.visible = false;
        }
        playSoundFx(this, AUDIO_ASSET_KEYS.GRASS);
        break;
      case ENCOUNTER_TILE_TYPE.NONE:
        break;
      default:
        exhaustiveGuard(encounterTileType);
    }

    if (playerDirection !== DIRECTION.DOWN) {
      return;
    }
    this.#hideSpecialEncounterTiles();
  }

  #hideSpecialEncounterTiles() {
    this.#specialEncounterTileImageGameObjectGroup.getChildren().some((child: Phaser.GameObjects.Image) => {
      if (!child.active) {
        return false;
      }
      if (child.x === this.#player.sprite.x && child.y === this.#player.sprite.y) {
        child.active = false;
        child.visible = false;
        return true;
      }
      return false;
    });
  }

  // 玩家发送聊天消息的方法
  async sendChatMessage(message: string) {
    try {
      if (!message || !message.trim()) return;

      // 确保 #chatUi 已初始化
      if (!this.#chatUi) {
        this.#chatUi = this.scene.get(SCENE_KEYS.CHAT_SCENE) as ChatScene;

        if (!this.scene.isActive(SCENE_KEYS.CHAT_SCENE)) {
          console.log('Starting chat scene...');
          this.scene.launch(SCENE_KEYS.CHAT_SCENE);

          // 等待场景初始化完成
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // 再次检查chatUi是否正确初始化
      if (this.#chatUi && typeof this.#chatUi.addMessage === 'function') {
        this.#chatUi.addMessage(message, MessageType.PLAYER);
      } else {
        console.warn('无法发送消息: ChatUI未正确初始化');
      }
    } catch (error) {
      console.error('发送聊天消息失败:', error);
    }
  }

  // 添加公共方法供其他类检查战斗状态
  isWildMonsterEncountered(): boolean {
    return this.#wildMonsterEncountered;
  }
}
