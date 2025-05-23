const ASSET_CUT_FRAMES = Object.freeze({
  TL: 'TL',
  TM: 'TM',
  TR: 'TR',
  ML: 'ML',
  MM: 'MM',
  MR: 'MR',
  BL: 'BL',
  BM: 'BM',
  BR: 'BR',
});

const ASSET_CUT_FRAME_DATA_MANAGER_NAME = 'assetCutFrame';

export type NineSliceConfig = {
  cornerCutSize: number;
  textureManager: Phaser.Textures.TextureManager;
  assetKeys: string[];
};

export class NineSlice {
  #cornerCutSize: number;

  constructor(config: NineSliceConfig) {
    this.#cornerCutSize = config.cornerCutSize;
    config.assetKeys.forEach(assetKey => {
      this.#createNineSliceTextures(config.textureManager, assetKey);
    });
  }

  #createNineSliceTextures(textureManager: Phaser.Textures.TextureManager, assetKey: string) {
    const methodName = 'createNineSliceTextures';

    const texture = textureManager.get(assetKey);
    if (texture.key === '__MISSING') {
      console.warn(`[${NineSlice.name}:${methodName}] the provided texture asset key was not found`);
      return;
    }

    // get the original frame so we can use the image dimensions
    if (!texture.frames['__BASE']) {
      console.warn(`[${NineSlice.name}:${methodName}] the provided texture asset key does not have a base texture`);
      return;
    }

    // check to see if the texture already has more frames than the original base frame
    if (texture.getFrameNames(false).length !== 0) {
      console.debug(`[${NineSlice.name}:${methodName}] the provided texture asset key already has additional frames`);
      return;
    }

    const baseFrame: Phaser.Textures.Frame = texture.frames['__BASE'];

    // start in the top left corner for our first cut
    texture.add(ASSET_CUT_FRAMES.TL, 0, 0, 0, this.#cornerCutSize, this.#cornerCutSize);
    // for the middle, we need to calculate the width remaining after we take our two cuts
    texture.add(
      ASSET_CUT_FRAMES.TM,
      0,
      this.#cornerCutSize,
      0,
      baseFrame.width - this.#cornerCutSize * 2,
      this.#cornerCutSize,
    );
    // for the top right side corner we just need to take the total width and remove the cut length
    texture.add(
      ASSET_CUT_FRAMES.TR,
      0,
      baseFrame.width - this.#cornerCutSize,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize,
    );

    // for the middle left, we take the overall image height and subtract the size of the two corner cuts to get new height
    texture.add(
      ASSET_CUT_FRAMES.ML,
      0,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize * 2,
    );
    // for the middle, we need to take the overall image height and width, subtract the two corner cuts to get the new dimensions
    texture.add(
      ASSET_CUT_FRAMES.MM,
      0,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.width - this.#cornerCutSize * 2,
      baseFrame.height - this.#cornerCutSize * 2,
    );
    // for the middle right, we need to do similar logic that was done for the middle left piece
    texture.add(
      ASSET_CUT_FRAMES.MR,
      0,
      baseFrame.width - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize * 2,
    );

    // for the bottom left, we take the overall image height and subtract the corner cut
    texture.add(
      ASSET_CUT_FRAMES.BL,
      0,
      0,
      baseFrame.height - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize,
    );
    // for the middle and right, we do the same logic we did in th tm and tr frames, just at a lower y value
    texture.add(
      ASSET_CUT_FRAMES.BM,
      0,
      this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize,
      baseFrame.width - this.#cornerCutSize * 2,
      this.#cornerCutSize,
    );
    texture.add(
      ASSET_CUT_FRAMES.BR,
      0,
      baseFrame.width - this.#cornerCutSize,
      baseFrame.height - this.#cornerCutSize,
      this.#cornerCutSize,
      this.#cornerCutSize,
    );
  }

  createNineSliceContainer(
    scene: Phaser.Scene,
    targetWidth: number,
    targetHeight: number,
    assetKey: string,
  ): Phaser.GameObjects.Container {
    const tl = scene.add.image(0, 0, assetKey, ASSET_CUT_FRAMES.TL).setOrigin(0);
    tl.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.TL);

    const tm = scene.add.image(tl.displayWidth, 0, assetKey, ASSET_CUT_FRAMES.TM).setOrigin(0);
    tm.displayWidth = targetWidth - this.#cornerCutSize * 2;
    tm.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.TM);

    const tr = scene.add.image(tl.displayWidth + tm.displayWidth, 0, assetKey, ASSET_CUT_FRAMES.TR).setOrigin(0);
    tr.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.TR);

    const ml = scene.add.image(0, tl.displayHeight, assetKey, ASSET_CUT_FRAMES.ML).setOrigin(0);
    ml.displayHeight = targetHeight - this.#cornerCutSize * 2;
    ml.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.ML);

    const mm = scene.add.image(ml.displayWidth, ml.y, assetKey, ASSET_CUT_FRAMES.MM).setOrigin(0);
    mm.displayHeight = targetHeight - this.#cornerCutSize * 2;
    mm.displayWidth = targetWidth - this.#cornerCutSize * 2;
    mm.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.MM);

    const mr = scene.add.image(ml.displayWidth + mm.displayWidth, ml.y, assetKey, ASSET_CUT_FRAMES.MR).setOrigin(0);
    mr.displayHeight = mm.displayHeight;
    mr.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.MR);

    const bl = scene.add.image(0, tl.displayHeight + ml.displayHeight, assetKey, ASSET_CUT_FRAMES.BL).setOrigin(0);
    bl.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.BL);

    const bm = scene.add.image(bl.displayWidth, bl.y, assetKey, ASSET_CUT_FRAMES.BM).setOrigin(0);
    bm.displayWidth = tm.displayWidth;
    bm.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.BM);

    const br = scene.add.image(bl.displayWidth + bm.displayWidth, bl.y, assetKey, ASSET_CUT_FRAMES.BR).setOrigin(0);
    br.setData(ASSET_CUT_FRAME_DATA_MANAGER_NAME, ASSET_CUT_FRAMES.BR);

    // finally, create a container to group our new game objects together in
    return scene.add.container(0, 0, [tl, tm, tr, ml, mm, mr, bl, bm, br]);
  }

  updateNineSliceContainerTexture(
    textureManager: Phaser.Textures.TextureManager,
    container: Phaser.GameObjects.Container,
    assetKey: string,
  ) {
    const methodName = 'updateNineSliceContainerTexture';

    // validate we have the provided texture for the given asset key
    const texture = textureManager.get(assetKey);
    if (texture.key === '__MISSING') {
      console.warn(`[${NineSlice.name}:${methodName}] the provided texture asset key was not found`);
      return;
    }
    // check to see if the texture has more than the base frames defined
    if (texture.getFrameNames(false).length === 0) {
      console.warn(
        `[${NineSlice.name}:${methodName}] the provided texture asset key does not have the required nine slice frames`,
      );
      return;
    }

    container.each(gameObject => {
      const phaserImageGameObject: Phaser.GameObjects.Image = gameObject;
      if (phaserImageGameObject.type !== 'Image') {
        return;
      }
      const frameName = phaserImageGameObject.getData(ASSET_CUT_FRAME_DATA_MANAGER_NAME);
      if (frameName === undefined) {
        return;
      }
      phaserImageGameObject.setTexture(assetKey, frameName);
    });
  }
}
