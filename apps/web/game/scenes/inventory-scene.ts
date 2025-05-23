import { INVENTORY_ASSET_KEYS, UI_ASSET_KEYS } from '../assets/asset-keys';
import { KENNEY_FUTURE_NARROW_FONT_NAME } from '../assets/font-keys';
import { DIRECTION, Direction } from '../common/direction';
import { dataManager } from '../utils/data-manager';
import { exhaustiveGuard } from '../utils/guard';
import { NineSlice } from '../utils/nine-slice';
import { BaseScene } from './base-scene';
import { SCENE_KEYS } from './scene-keys';
import { ITEM_CATEGORY, InventoryItem, Item } from '../types/typedef';
import { MonsterPartySceneData } from './monster-party-scene';

const CANCEL_TEXT_DESCRIPTION = 'Close your bag, and go back to adventuring!';
const CANNOT_USE_ITEM_TEXT = 'That item cannot be used right now.';

const INVENTORY_ITEM_POSITION = Object.freeze({
  x: 50,
  y: 14,
  space: 50,
});

const INVENTORY_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#000000',
  fontSize: '30px',
};

const QUANTITY_TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: KENNEY_FUTURE_NARROW_FONT_NAME,
  color: '#000000',
  fontSize: '30px',
  align: 'right',
};

const ITEMS_PER_PAGE = 6;

export type InventoryItemGameObjects = {
  itemName?: Phaser.GameObjects.Text;
  // quantitySign?: Phaser.GameObjects.Text;
  quantity?: Phaser.GameObjects.Text;
};

export interface InventoryItemWithGameObjects extends InventoryItem {
  gameObjects: InventoryItemGameObjects;
}

export type CustomInventory = InventoryItemWithGameObjects[];

export type InventorySceneData = {
  previousSceneName: string;
  isBattling: boolean;
};

export type InventorySceneWasResumedData = {
  wasItemUsed: boolean;
};

export type InventorySceneItemUsedData = {
  wasItemUsed: boolean;
  item?: Item;
};

export class InventoryScene extends BaseScene {
  #sceneData: InventorySceneData;
  #nineSliceMainContainer: NineSlice;
  #selectedInventoryDescriptionText: Phaser.GameObjects.Text;
  #userInputCursor: Phaser.GameObjects.Image;
  #inventory: CustomInventory;
  #selectedInventoryOptionIndex: number;
  #waitingForInput: boolean;
  #currentPage: number;
  #pageText: Phaser.GameObjects.Text;
  #container: Phaser.GameObjects.Container;
  #cancelText: Phaser.GameObjects.Text;

  constructor() {
    super({
      key: SCENE_KEYS.INVENTORY_SCENE,
    });
  }

  async init(data: InventorySceneData) {
    super.init(data);

    this.#waitingForInput = false;
    this.#sceneData = data;
    this.#selectedInventoryOptionIndex = 0;
    this.#currentPage = 0;

    this.#nineSliceMainContainer = new NineSlice({
      cornerCutSize: 32,
      textureManager: this.sys.textures,
      assetKeys: [UI_ASSET_KEYS.MENU_BACKGROUND],
    });
  }

  #clearCurrentPageItems() {
    if (this.#container) {
      this.#inventory.forEach(item => {
        if (item.gameObjects.itemName) item.gameObjects.itemName.destroy();
        if (item.gameObjects.quantity) item.gameObjects.quantity.destroy();
        // if (item.gameObjects.quantitySign) item.gameObjects.quantitySign.destroy();
      });
      if (this.#cancelText) {
        this.#cancelText.destroy();
      }
    }
  }

  #displayCurrentPageItems() {
    this.#clearCurrentPageItems();

    const startIndex = this.#currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, this.#inventory.length);
    const itemsOnCurrentPage = endIndex - startIndex;

    for (let i = startIndex; i < endIndex; i++) {
      const displayIndex = i - startIndex;
      const inventoryItem = this.#inventory[i];

      const itemText = this.add.text(
        INVENTORY_ITEM_POSITION.x,
        INVENTORY_ITEM_POSITION.y + displayIndex * INVENTORY_ITEM_POSITION.space,
        inventoryItem.item.name,
        {
          ...INVENTORY_TEXT_STYLE,
          wordWrap: { width: 500 },
        },
      );

      // Adjust the position of the quantity display, using right alignment
      const quantityContainer = this.add.container(
        680,
        INVENTORY_ITEM_POSITION.y + displayIndex * INVENTORY_ITEM_POSITION.space,
      );

      const qty2Text = this.add
        .text(0, 0, `${inventoryItem.quantity}`, {
          ...QUANTITY_TEXT_STYLE,
          fixedWidth: 100,
        })
        .setOrigin(1, 0); // Right align numbers

      // const qty1Text = this.add.text(qty2Text.x - qty2Text.width - 10, 0, 'x', {
      //   color: '#000000',
      //   fontSize: '30px',
      // });

      quantityContainer.add([qty2Text]);
      this.#container.add([itemText, quantityContainer]);
      inventoryItem.gameObjects = {
        itemName: itemText,
        quantity: qty2Text,
        // quantitySign: qty1Text,
      };
    }

    // Create cancel text at the correct position after the last item
    this.#cancelText = this.add.text(
      INVENTORY_ITEM_POSITION.x,
      INVENTORY_ITEM_POSITION.y + itemsOnCurrentPage * INVENTORY_ITEM_POSITION.space,
      'Cancel',
      INVENTORY_TEXT_STYLE,
    );
    this.#container.add(this.#cancelText);

    // Update page text
    const totalPages = Math.ceil(this.#inventory.length / ITEMS_PER_PAGE);
    this.#pageText.setText(`PAGE ${this.#currentPage + 1}/${totalPages}`);
  }

  async create() {
    super.create();

    const inventory = await dataManager.getInventory();
    this.#inventory = inventory.map(inventoryItem => {
      return {
        item: inventoryItem.item,
        quantity: inventoryItem.quantity,
        gameObjects: {},
      };
    });

    // create custom background
    this.add.image(0, 0, INVENTORY_ASSET_KEYS.INVENTORY_BACKGROUND).setOrigin(0);
    this.add.image(40, 120, INVENTORY_ASSET_KEYS.INVENTORY_BAG).setOrigin(0).setScale(0.5);

    this.#container = this.#nineSliceMainContainer
      .createNineSliceContainer(this, 700, 360, UI_ASSET_KEYS.MENU_BACKGROUND)
      .setPosition(300, 20);

    const containerBackground = this.add.rectangle(4, 4, 692, 352, 0xffff88).setOrigin(0).setAlpha(0.6);
    this.#container.add(containerBackground);

    // Add page text
    this.#pageText = this.add
      .text(600, 320, '', {
        ...INVENTORY_TEXT_STYLE,
        fontSize: '24px',
        color: '#000000',
      })
      .setOrigin(1, 1);
    this.#container.add(this.#pageText);

    // Display initial page
    this.#displayCurrentPageItems();

    // create player input cursor
    this.#userInputCursor = this.add.image(30, 30, UI_ASSET_KEYS.CURSOR).setScale(3);
    this.#container.add(this.#userInputCursor);

    // create inventory description text
    this.#selectedInventoryDescriptionText = this.add.text(25, 420, '', {
      ...INVENTORY_TEXT_STYLE,
      ...{
        wordWrap: {
          width: this.scale.width - 18,
        },
        color: '#ffffff',
      },
    });
    this.#updateItemDescriptionText();
  }

  update() {
    super.update();

    if (this._controls.isInputLocked) {
      return;
    }

    if (this._controls.wasBackKeyPressed()) {
      if (this.#waitingForInput) {
        // update text description and let player select new items
        this.#updateItemDescriptionText();
        this.#waitingForInput = false;
        return;
      }

      this.#goBackToPreviousScene(false);
      return;
    }

    const wasSpaceKeyPressed = this._controls.wasSpaceKeyPressed();
    if (wasSpaceKeyPressed) {
      if (this.#waitingForInput) {
        // update text description and let player select new items
        this.#updateItemDescriptionText();
        this.#waitingForInput = false;
        return;
      }

      if (this.#isCancelButtonSelected()) {
        this.#goBackToPreviousScene(false);
        return;
      }

      const currentPageStartIndex = this.#currentPage * ITEMS_PER_PAGE;
      const selectedItemIndex = currentPageStartIndex + this.#selectedInventoryOptionIndex;

      console.log(
        `Selected item - Current page: ${this.#currentPage}, Page index: ${this.#selectedInventoryOptionIndex}, Global index: ${selectedItemIndex}`,
      );

      if (this.#inventory[selectedItemIndex].quantity < 1) {
        return;
      }

      const selectedItem = this.#inventory[selectedItemIndex].item;
      console.log(`Selected item: ${selectedItem.name}, Category: ${selectedItem.category}`);

      // validate that the item can be used if we are outside battle (capture ball example)
      if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
        // check to see if the selected item needs a target monster, example if selecting
        // a capture ball, no monster needed, vs selecting a potion, player needs to choose the
        // target monster
        if (selectedItem.category === ITEM_CATEGORY.CAPTURE) {
          // TODO: this logic will need to be updated if we support a monster storage system
          // validate we have room in our party before attempting capture
          if (dataManager.isPartyFull()) {
            this.#selectedInventoryDescriptionText.setText('You have no room in your party! Cannot use that item.');
            this.#waitingForInput = true;
            return;
          }

          this.#handleItemUsed();
          this.#goBackToPreviousScene(true, selectedItem);
          return;
        }
      }

      if (selectedItem.category === ITEM_CATEGORY.CAPTURE) {
        // display message to player that the item cant be used now
        this.#selectedInventoryDescriptionText.setText(CANNOT_USE_ITEM_TEXT);
        this.#waitingForInput = true;
        return;
      }

      this._controls.lockInput = true;
      // pause this scene and launch the monster party scene
      const sceneDataToPass: MonsterPartySceneData = {
        previousSceneName: SCENE_KEYS.INVENTORY_SCENE,
        itemSelected: this.#inventory[selectedItemIndex].item,
        isBattling: this.#sceneData.isBattling,
      };
      this.scene.launch(SCENE_KEYS.MONSTER_PARTY_SCENE, sceneDataToPass);
      this.scene.pause(SCENE_KEYS.INVENTORY_SCENE);

      // in a future update
      // TODO: add submenu for accept/cancel after picking an item
      return;
    }

    if (this.#waitingForInput) {
      return;
    }

    const selectedDirection = this._controls.getDirectionKeyJustPressed();
    if (selectedDirection !== DIRECTION.NONE) {
      this.#movePlayerInputCursor(selectedDirection);
      this.#updateItemDescriptionText();
    }
  }

  handleSceneResume(sys: Phaser.Scenes.Systems, data?: InventorySceneWasResumedData | undefined) {
    super.handleSceneResume(sys, data);

    if (!data || !data.wasItemUsed) {
      return;
    }

    console.log(`Scene resumed - Item used: ${data.wasItemUsed}, Current page: ${this.#currentPage}`);
    const updatedItem = this.#handleItemUsed();
    // TODO: add logic to handle when the last of an item was just used

    // if previous scene was battle scene, switch back to that scene
    if (this.#sceneData.previousSceneName === SCENE_KEYS.BATTLE_SCENE) {
      this.#goBackToPreviousScene(true, updatedItem.item);
    }
  }

  #updateItemDescriptionText() {
    if (this.#isCancelButtonSelected()) {
      this.#selectedInventoryDescriptionText.setText(CANCEL_TEXT_DESCRIPTION);
      return;
    }

    const currentPageStartIndex = this.#currentPage * ITEMS_PER_PAGE;
    const selectedItemIndex = currentPageStartIndex + this.#selectedInventoryOptionIndex;
    this.#selectedInventoryDescriptionText.setText(this.#inventory[selectedItemIndex].item.description);
  }

  #isCancelButtonSelected() {
    const startIndex = this.#currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, this.#inventory.length);
    const itemsOnCurrentPage = endIndex - startIndex;
    return this.#selectedInventoryOptionIndex === itemsOnCurrentPage;
  }

  #goBackToPreviousScene(wasItemUsed: boolean, item?: Item) {
    this._controls.lockInput = true;
    this.scene.stop(SCENE_KEYS.INVENTORY_SCENE);
    const sceneDataToPass: InventorySceneItemUsedData = {
      wasItemUsed,
      item,
    };
    this.scene.resume(this.#sceneData.previousSceneName, sceneDataToPass);
  }

  #movePlayerInputCursor(direction: Direction) {
    const startIndex = this.#currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, this.#inventory.length);
    const itemsOnCurrentPage = endIndex - startIndex;

    console.log(
      `Cursor movement - Current page: ${this.#currentPage}, Direction: ${direction}, Items on page: ${itemsOnCurrentPage}`,
    );

    switch (direction) {
      case DIRECTION.UP:
        this.#selectedInventoryOptionIndex -= 1;
        if (this.#selectedInventoryOptionIndex < 0) {
          this.#selectedInventoryOptionIndex = itemsOnCurrentPage;
        }
        console.log(`Moving up - New index: ${this.#selectedInventoryOptionIndex}`);
        break;
      case DIRECTION.DOWN:
        this.#selectedInventoryOptionIndex += 1;
        if (this.#selectedInventoryOptionIndex > itemsOnCurrentPage) {
          this.#selectedInventoryOptionIndex = 0;
        }
        console.log(`Moving down - New index: ${this.#selectedInventoryOptionIndex}`);
        break;
      case DIRECTION.LEFT:
        if (this.#currentPage > 0) {
          this.#currentPage--;
          this.#selectedInventoryOptionIndex = 0;
          this.#displayCurrentPageItems();
          this.#userInputCursor.setY(30);
          console.log(`Page left - New page: ${this.#currentPage}`);
        }
        return;
      case DIRECTION.RIGHT:
        const totalPages = Math.ceil(this.#inventory.length / ITEMS_PER_PAGE);
        if (this.#currentPage < totalPages - 1) {
          this.#currentPage++;
          this.#selectedInventoryOptionIndex = 0;
          this.#displayCurrentPageItems();
          this.#userInputCursor.setY(30);
          console.log(`Page right - New page: ${this.#currentPage}`);
        }
        return;
      case DIRECTION.NONE:
        break;
      default:
        exhaustiveGuard(direction);
    }

    const y = 30 + this.#selectedInventoryOptionIndex * 50;
    this.#userInputCursor.setY(y);
  }

  #handleItemUsed(): InventoryItemWithGameObjects {
    const currentPageStartIndex = this.#currentPage * ITEMS_PER_PAGE;
    const selectedItemIndex = currentPageStartIndex + this.#selectedInventoryOptionIndex;
    console.log(
      `Using item - Current page: ${this.#currentPage}, Page index: ${this.#selectedInventoryOptionIndex}, Global index: ${selectedItemIndex}`,
    );

    const selectedItem = this.#inventory[selectedItemIndex];
    console.log(
      `Used item: ${selectedItem.item.name}, Quantity: ${selectedItem.quantity} -> ${selectedItem.quantity - 1}`,
    );

    selectedItem.quantity -= 1;
    selectedItem.gameObjects.quantity.setText(`${selectedItem.quantity}`);
    dataManager.updateInventory(this.#inventory);
    return selectedItem;
  }
}
