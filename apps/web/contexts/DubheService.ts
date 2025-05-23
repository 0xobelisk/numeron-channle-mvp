import { Dubhe, loadMetadata, NetworkType, SuiTransactionBlockResponse, Transaction } from '@0xobelisk/sui-client';
import { PACKAGE_ID, NETWORK, SCHEMA_ID, DUBHE_SCHEMA_ID } from 'contracts/deployment';
import { getWalletInfo } from './CustomWallet';
import { InventoryItem, ITEM_EFFECT, ItemCategory, LOCATION_TYPE, Monster } from '@/game/types/typedef';
import { PlayerLocation } from '@/game/utils/data-manager';
import { TILE_SIZE } from '@/game/config';

export interface CraftPath {
  id: string;
  output_item_id: string;
  input_item_ids: string[];
  input_quantities: string[];
  output_quantities: string;
}

export interface ItemMetadata {
  item_id: string;
  description: string;
  icon_url: string;
  is_transferable: boolean;
  item_type: {
    [key: string]: string;
  };
  name: string;
}
/**
 * Wallet Utils Class - Provides methods for game interaction with wallet
 */
export class DubheService {
  dubhe: Dubhe;
  network: NetworkType;
  httpIndexerUrl: string;
  wsIndexerUrl: string;
  dubheContract?: Dubhe;

  constructor() {
    let PRIVATEKEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    if (NETWORK === 'localnet') {
      this.httpIndexerUrl = 'http://127.0.0.1:3001';
      this.wsIndexerUrl = 'ws://127.0.0.1:3001';
    } else if (NETWORK === 'testnet') {
      this.httpIndexerUrl = 'https://testnet-indexer.numeron.world';
      this.wsIndexerUrl = 'wss://testnet-indexer.numeron.world';
    }

    const dubhe = new Dubhe({
      networkType: NETWORK,
      packageId: PACKAGE_ID,
      secretKey: NETWORK === 'localnet' ? PRIVATEKEY : undefined,
      indexerUrl: this.httpIndexerUrl,
      indexerWsUrl: this.wsIndexerUrl,
    });
    this.dubhe = dubhe;
    this.network = NETWORK;
  }

  async initDubheContract() {
    const metadata = await loadMetadata(NETWORK, PACKAGE_ID);
    console.log('metadata', metadata);
    let PRIVATEKEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    const dubhe = new Dubhe({
      networkType: NETWORK,
      packageId: PACKAGE_ID,
      secretKey: NETWORK === 'localnet' ? PRIVATEKEY : undefined,
      indexerUrl: this.httpIndexerUrl,
      indexerWsUrl: this.wsIndexerUrl,
      metadata,
    });
    this.dubheContract = dubhe;
  }

  /**
   * Get current connected wallet account info
   * @returns Account info object or null (if wallet not connected)
   */
  getCurrentAccount() {
    if (this.network === 'localnet') {
      return {
        address: this.dubhe.getAddress(),
        email: '',
        isUsingEnoki: false,
      };
    }
    const { address, emailAddress, isUsingEnoki, isConnected } = getWalletInfo();
    if (isConnected) {
      return {
        address,
        email: emailAddress,
        isUsingEnoki,
      };
    }
    return null;
  }

  public async signAndExecuteTransaction({
    tx,
    onSuccess,
    onError,
  }: {
    tx: Transaction;
    onSuccess?: (result: SuiTransactionBlockResponse) => void;
    onError?: (error: Error) => void;
  }): Promise<SuiTransactionBlockResponse | null> {
    try {
      if (this.network === 'localnet') {
        console.log('sui address', this.dubhe.getAddress());
        return await this.dubhe.signAndSendTxn({
          tx,
          onSuccess,
          onError,
        });
      }

      if (!getWalletInfo().isConnected) {
        console.error('Wallet not connected, please connect first');
        return null;
      }

      return await getWalletInfo().signAndExecuteTransaction({
        tx,
        onSuccess,
        onError,
      });
    } catch (error) {
      console.error('Transaction execution failed:', error);
      return null;
    }
  }

  public async blanceOf({ address, coinType }: { address?: string; coinType?: string } = {}) {
    address = address || this.getWalletAddress();
    if (!address) {
      return 0;
    }
    const balance = await this.dubhe.getBalance(coinType);
    return String(BigInt(balance.totalBalance) / BigInt(10 ** 9));
  }

  async getOwnedItems(): Promise<InventoryItem[]> {
    const pageSize = 20;
    let balance = await this.dubhe.getStorage({
      name: 'balance',
      key1: this.getCurrentAccount().address,
      is_removed: false,
      first: pageSize,
    });

    let allBalanceData = [...balance.data];

    while (balance.pageInfo.hasNextPage) {
      const nextPage = await this.dubhe.getStorage({
        name: 'balance',
        key1: this.getCurrentAccount().address,
        is_removed: false,
        first: pageSize,
        after: balance.pageInfo.endCursor,
      });

      allBalanceData = [...allBalanceData, ...nextPage.data];
      balance = nextPage;
    }

    if (allBalanceData.length === 0) {
      return [];
    }
    console.log('allBalanceData', allBalanceData);
    const items: InventoryItem[] = await Promise.all(
      allBalanceData.map(async (balanceSchema: any) => {
        const item = await this.dubhe.getStorageItem({
          name: 'item_metadata',
          key1: balanceSchema.key2.toString(),
        });
        console.log('balanceSchema', balanceSchema);
        console.log('item', item);
        return {
          item: {
            id: Number(balanceSchema.key2),
            name: item.value.name,
            description: item.value.description,
            isTransferable: item.value.is_transferable,
            category: Object.keys(item.value.item_type)[0] as ItemCategory,
            effect: ITEM_EFFECT.DEFAULT, // TODO: add effect
          },
          quantity: Number(balanceSchema.value),
        };
      }),
    );

    items.sort((a, b) => a.item.id - b.item.id);

    return items;
  }

  async itemMetadatas(): Promise<ItemMetadata[]> {
    const itemMetadatas = await this.dubhe.getStorage({
      name: 'item_metadata',
      first: 999,
    });
    return itemMetadatas.data.map(itemMetadata => ({
      item_id: itemMetadata.key1.toString(),
      description: itemMetadata.value.description,
      icon_url: itemMetadata.value.icon_url,
      is_transferable: itemMetadata.value.is_transferable,
      item_type: itemMetadata.value.item_type,
      name: itemMetadata.value.name,
    }));
  }
  async getPlayerPosition(): Promise<{ x: number; y: number; location: PlayerLocation }> {
    const playerPosition = await this.dubhe.getStorageItem({
      name: 'position',
      key1: this.getCurrentAccount().address,
    });

    if (playerPosition?.value) {
      return {
        x: Number(playerPosition.value.x) * TILE_SIZE,
        y: Number(playerPosition.value.y) * TILE_SIZE,
        location: LOCATION_TYPE[playerPosition.value.map_id],
      };
    }
    return { x: 0, y: 0, location: { area: 'main_1', isInterior: false } };
  }

  async getOwnedMonsters(): Promise<Monster[]> {
    const playerMonstersId = await this.dubhe.getStorageItem({
      name: 'monster_owned_by',
      key1: this.getCurrentAccount().address,
    });
    console.log('playerMonstersId', playerMonstersId);
    if (playerMonstersId === undefined) {
      return [];
    }

    const playerMonsters: Monster[] = await Promise.all(
      playerMonstersId.value.map(async (monsterSchema: any) => {
        const monster = await this.dubhe.getStorageItem({
          name: 'monster',
          key1: monsterSchema.toString(),
        });
        if (monster === undefined) {
          return [];
        }
        return {
          id: monster.data.key1.toString(),
          monsterId: Number(monster.data.key1),
          name: monster.value.name,
          assetKey: monster.value.name.toUpperCase(),
          assetFrame: Number(monster.value.asset_frame),
          currentLevel: Number(monster.value.current_level),
          maxHp: Number(monster.value.max_hp),
          currentHp: Number(monster.value.current_hp),
          baseAttack: Number(monster.value.base_attack),
          attackIds: monster.value.attack_ids.map((attackId: string) => Number(attackId)),
          currentAttack: Number(monster.value.current_attack),
          baseExp: Number(monster.value.base_exp),
          currentExp: Number(monster.value.current_exp),
        };
      }),
    );
    console.log('playerMonsters', playerMonsters);

    return playerMonsters;
  }

  async queryItemCraftPath(): Promise<CraftPath[]> {
    const itemCraftPath = await this.dubhe.getStorage({
      name: 'item_craft_path',
    });
    // return itemCraftPath.value;
    console.log('itemCraftPath', itemCraftPath);
    const itemCraftPathFormat = await Promise.all(
      itemCraftPath.data.map(async (itemCraftPathSchema: any) => {
        return {
          id: itemCraftPathSchema.key1.toString(),
          output_item_id: itemCraftPathSchema.key1,
          input_item_ids: itemCraftPathSchema.value.input_item_ids,
          input_quantities: itemCraftPathSchema.value.input_quantities,
          output_quantities: itemCraftPathSchema.value.output_quantities,
        };
      }),
    );
    console.log('itemCraftPathFormat', itemCraftPathFormat);

    return itemCraftPathFormat;
  }

  async craftItem(itemId: bigint | string | number) {
    try {
      if (!this.dubheContract) {
        console.log('初始化Dubhe合约...');
        await this.initDubheContract();
      }

      const tx = new Transaction();
      console.log('开始构建合成交易...', { itemId });

      await this.dubheContract.tx.numeron_item_system.craft({
        tx,
        params: [tx.object(DUBHE_SCHEMA_ID), tx.object(SCHEMA_ID), tx.pure.u256(itemId)],
        isRaw: true,
      });

      console.log('交易构建完成，准备执行...');

      const result = await this.signAndExecuteTransaction({
        tx,
        onSuccess: async (result: any) => {
          console.log('交易执行成功:', {
            digest: result.digest,
            status: result.effects?.status?.status,
            gasUsed: result.effects?.gasUsed,
          });
          await this.dubheContract.waitForIndexerTransaction(result.digest);
        },
        onError: (error: any) => {
          console.error('交易执行失败:', {
            error: error.toString(),
            message: error.message,
            details: error.details,
            code: error.code,
          });
          throw error; // 重新抛出错误以便上层捕获
        },
      });

      if (!result) {
        throw new Error('交易执行返回为空');
      }

      return {
        result: result.digest,
        txUrl: this.dubhe.getTxExplorerUrl(result.digest),
      };
    } catch (error: any) {
      console.error('合成物品过程中发生错误:', {
        error: error.toString(),
        message: error.message,
        details: error.details,
        code: error.code,
        stack: error.stack,
      });
      throw error; // 重新抛出错误以便上层处理
    }
  }

  /**
   * Check if wallet is currently connected
   * @returns Boolean indicating if wallet is connected
   */
  public isWalletConnected(): boolean {
    return getWalletInfo().isConnected || false;
  }

  /**
   * Get current connected wallet address
   * @returns Wallet address string or null (if wallet not connected)
   */
  public getWalletAddress(): string | null {
    return this.getCurrentAccount()?.address || null;
  }

  public getIndexerUrl(): { http: string; ws: string } {
    return {
      http: this.httpIndexerUrl,
      ws: this.wsIndexerUrl,
    };
  }

  /**
   * Get current user's email address
   * @returns Email address string or null (if wallet not connected)
   */
  public getEmailAddress(): string | null {
    return this.getCurrentAccount()?.email || null;
  }

  /**
   * Logout current wallet
   */
  public logout(): void {
    if (getWalletInfo().isConnected) {
      getWalletInfo().logout();
    }
  }

  /**
   * Redirect to authentication page
   */
  public redirectToAuth(): void {
    if (getWalletInfo().isConnected) {
      getWalletInfo().redirectToAuthUrl();
    }
  }
}
