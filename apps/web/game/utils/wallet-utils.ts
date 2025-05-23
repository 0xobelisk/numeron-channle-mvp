import { Transaction } from '@mysten/sui/transactions';
import { Dubhe, NetworkType } from '@0xobelisk/sui-client';
import { NETWORK, PACKAGE_ID, SCHEMA_ID } from 'contracts/deployment';
import { SuiTransactionBlockResponse, SuiTransactionBlockResponseOptions } from '@0xobelisk/sui-client';
import {
  ExecuteTransactionBlockWithoutSponsorshipProps,
  SignAndExecuteTransactionProps,
} from '@/contexts/CustomWallet';

let PRIVATEKEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
// Add customWallet property type to window object
declare global {
  interface Window {
    customWallet?: {
      isConnected: boolean;
      isUsingEnoki: boolean;
      address?: string;
      jwt?: string;
      emailAddress: string | null;
      executeTransactionBlockWithoutSponsorship: (
        props: ExecuteTransactionBlockWithoutSponsorshipProps,
      ) => Promise<any>;
      signAndExecuteTransaction: (props: SignAndExecuteTransactionProps) => Promise<any>;
      logout: () => void;
      redirectToAuthUrl: () => void;
      getAddressSeed: () => Promise<string>;
    };
  }
}

/**
 * Wallet Utils Class - Provides methods for game interaction with wallet
 */
class WalletUtils {
  private static instance: WalletUtils;
  dubhe: Dubhe;
  network: NetworkType;
  httpIndexerUrl: string;
  wsIndexerUrl: string;

  private constructor() {
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

  /**
   * Get WalletUtils singleton instance
   */
  public static getInstance(): WalletUtils {
    if (!WalletUtils.instance) {
      WalletUtils.instance = new WalletUtils();
    }
    return WalletUtils.instance;
  }

  /**
   * Get current connected wallet account info
   * @returns Account info object or null (if wallet not connected)
   */
  public getCurrentAccount() {
    if (this.network === 'localnet') {
      return {
        address: this.dubhe.getAddress(),
        email: '',
        isUsingEnoki: false,
      };
    }
    if (window.customWallet && window.customWallet.isConnected) {
      return {
        address: window.customWallet.address,
        email: window.customWallet.emailAddress,
        isUsingEnoki: window.customWallet.isUsingEnoki,
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

      if (!window.customWallet || !window.customWallet.isConnected) {
        console.error('Wallet not connected, please connect first');
        return null;
      }

      return await window.customWallet.signAndExecuteTransaction({
        tx,
        onSuccess,
        onError,
      });
    } catch (error) {
      console.error('Transaction execution failed:', error);
      return null;
    }
  }

  public async blanceOf({ address, coinType }: { address?: string; coinType?: string }) {
    address = address || this.getWalletAddress();
    if (!address) {
      return 0;
    }
    return await this.dubhe.getBalance(coinType);
  }

  /**
   * Check if wallet is currently connected
   * @returns Boolean indicating if wallet is connected
   */
  public isWalletConnected(): boolean {
    return window.customWallet?.isConnected || false;
  }

  /**
   * Get current connected wallet address
   * @returns Wallet address string or null (if wallet not connected)
   */
  public getWalletAddress(): string | null {
    // return window.customWallet?.address || null;
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
    // return window.customWallet?.emailAddress || null;
    return this.getCurrentAccount()?.email || null;
  }

  /**
   * Logout current wallet
   */
  public logout(): void {
    if (window.customWallet) {
      window.customWallet.logout();
    }
  }

  /**
   * Redirect to authentication page
   */
  public redirectToAuth(): void {
    if (window.customWallet) {
      window.customWallet.redirectToAuthUrl();
    }
  }
}

// Export utils class singleton
export const walletUtils = WalletUtils.getInstance();
