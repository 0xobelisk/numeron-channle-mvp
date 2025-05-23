import { Dubhe, Transaction } from '@0xobelisk/sui-client';

// 交易对象接口
export interface TxObject {
  id: string; // 唯一标识
  tx: Transaction;
  type: string; // 交易类型(如 'MOVE','ATTACK' 等)
  retryCount: number; // 重试次数
  timestamp: number;
}

export class TransactionStateMachine {
  private static instance: TransactionStateMachine;
  #txQueue: TxObject[];
  #isProcessing: boolean;
  #dubhe: Dubhe;

  private constructor() {
    this.#txQueue = [];
    this.#isProcessing = false;
  }

  public static getInstance(): TransactionStateMachine {
    if (!TransactionStateMachine.instance) {
      TransactionStateMachine.instance = new TransactionStateMachine();
    }
    return TransactionStateMachine.instance;
  }

  public initDubhe(dubhe: any) {
    this.#dubhe = dubhe;
  }

  // 添加交易到队列
  public addTransaction(tx: Transaction, type: string): string {
    const txObject: TxObject = {
      id: `${type}_${Date.now()}`,
      tx,
      type,
      retryCount: 0,
      timestamp: Date.now(),
    };

    this.#txQueue.push(txObject);
    return txObject.id;
  }

  // 处理单个交易
  private async processTx(txObject: TxObject) {
    if (!this.#dubhe) {
      console.error('Dubhe not initialized');
      return;
    }

    try {
      const result = await this.#dubhe.signAndSendTxn({
        tx: txObject.tx,
        onSuccess: async (result: any) => {
          console.log(`Transaction ${txObject.id} successful:`, result);
        },
        onError: (error: any) => {
          console.error(`Transaction ${txObject.id} failed:`, error);
        },
      });

      await this.#dubhe.waitForIndexerTransaction(result.digest);
    } catch (error) {
      console.error(`Transaction ${txObject.id} execution error:`, error);
    }
  }

  // 更新队列处理
  public async update() {
    if (this.#isProcessing || this.#txQueue.length === 0) {
      return;
    }

    this.#isProcessing = true;
    try {
      const tx = this.#txQueue.shift();
      if (tx) {
        await this.processTx(tx);
      }
    } finally {
      this.#isProcessing = false;
    }
  }

  public getQueueLength(): number {
    return this.#txQueue.length;
  }

  public clearQueue() {
    this.#txQueue = [];
  }
}
