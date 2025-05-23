import { Controls } from '../utils/controls';
import { Dubhe } from '@0xobelisk/sui-client';
import { NETWORK, PACKAGE_ID, SCHEMA_ID, DUBHE_SCHEMA_ID } from 'contracts/deployment';
import { loadMetadata } from '@0xobelisk/sui-client';
import { walletUtils } from '../utils/wallet-utils';

export class BaseScene extends Phaser.Scene {
  _controls: Controls;
  _dubhe: Dubhe;
  _schemaId: string;
  _dubheSchemaId: string;

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config);
    if (this.constructor === BaseScene) {
      throw new Error('BaseScene is an abstract class and cannot be instantiated.');
    }
    this._schemaId = SCHEMA_ID;
    this._dubheSchemaId = DUBHE_SCHEMA_ID;
  }

  init(data?: any) {
    if (data) {
      this._log(`[${this.constructor.name}:init] invoked, data provided: ${JSON.stringify(data)}`);
      return;
    }
    this._log(`[${this.constructor.name}:init] invoked`);
  }

  preload() {
    this._log(`[${this.constructor.name}:preload] invoked`);
  }

  async create() {
    this._log(`[${this.constructor.name}:create] invoked`);

    this._controls = new Controls(this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleSceneCleanup, this);

    const metadata = await loadMetadata(NETWORK, PACKAGE_ID);

    this._dubhe = new Dubhe({
      networkType: NETWORK,
      packageId: PACKAGE_ID,
      metadata: metadata,
      indexerUrl: walletUtils.getIndexerUrl().http,
      indexerWsUrl: walletUtils.getIndexerUrl().ws,
    });

    this.scene.bringToTop();
  }

  update(time?: DOMHighResTimeStamp) {
    if (this._controls === undefined) {
      return;
    }

    if (!this._controls.wasFKeyPressed()) {
      return;
    }

    if (this.scale.isFullscreen) {
      this.scale.stopFullscreen();
      return;
    }

    this.scale.startFullscreen();
  }

  handleSceneResume(sys: Phaser.Scenes.Systems, data?: any | undefined) {
    this._controls.lockInput = false;
    if (data) {
      this._log(`[${this.constructor.name}:handleSceneResume] invoked, data provided: ${JSON.stringify(data)}`);
      return;
    }
    this._log(`[${this.constructor.name}:handleSceneResume] invoked`);
  }

  handleSceneCleanup() {
    this._log(`[${this.constructor.name}:handleSceneCleanup] invoked`);
    this.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
  }

  /**
   * @protected
   * @param {string} message
   */
  _log(message) {
    console.log(`%c${message}`, 'color: orange; background: black;');
  }
}
