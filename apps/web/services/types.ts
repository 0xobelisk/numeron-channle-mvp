import { Transaction } from '@mysten/sui/transactions';
import { SuiTransactionBlockResponse, SuiTransactionBlockResponseOptions } from '@0xobelisk/sui-client';

export interface CustomWalletServiceConfig {
  suiNetwork: string;
  suiClient: any; // 这里需要根据实际使用的 Sui 客户端类型来定义
}

export interface ExecuteTransactionBlockWithoutSponsorshipProps {
  tx: Transaction;
  options: SuiTransactionBlockResponseOptions;
  senderAddress: string;
  signature: string;
}

export interface SignAndExecuteTransactionProps {
  tx: Transaction;
  senderAddress: string;
  signature: string;
  onSuccess?: (result: SuiTransactionBlockResponse) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

export interface WalletInfo {
  address: string;
  isUsingEnoki: boolean;
  emailAddress?: string;
  jwt?: string;
}

export interface TransactionResult {
  success: boolean;
  digest?: string;
  error?: string;
  response?: SuiTransactionBlockResponse;
}
