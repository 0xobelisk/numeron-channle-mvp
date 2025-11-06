import { Dubhe, NetworkType, SuiMoveNormalizedModules, Transaction } from '@0xobelisk/sui-client';
import { NETWORK, PACKAGE_ID } from 'contracts/deployment';
import { SuiTransactionBlockResponse, SuiTransactionBlockResponseOptions } from '@0xobelisk/sui-client';
import {
  ExecuteTransactionBlockWithoutSponsorshipProps,
  SignAndExecuteTransactionProps,
} from '@/contexts/CustomWallet';
import { DubheGraphqlClient } from '@0xobelisk/graphql-client';
import { DubheGrpcClient } from '@0xobelisk/grpc-client';
import contractMetadata from 'contracts/metadata.json';
import dubheMetadata from 'contracts/dubhe.config.json';

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
  endpoint: {
    http: string;
    ws: string;
    grpc: string;
  };
  graphqlClient: DubheGraphqlClient;
  grpcClient: DubheGrpcClient;

  private constructor() {
    let PRIVATEKEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    if (NETWORK === 'localnet') {
      this.endpoint = {
        http: 'http://127.0.0.1:4000/graphql',
        ws: 'ws://127.0.0.1:4000/graphql',
        grpc: 'http://127.0.0.1:8080',
      };
    } else if (NETWORK === 'testnet') {
      this.endpoint = {
        http: 'https://testnet-indexer.numeron.world',
        ws: 'wss://testnet-indexer.numeron.world',
        grpc: 'https://testnet-indexer.numeron.world',
      };
    }

    const dubhe = new Dubhe({
      networkType: NETWORK,
      packageId: PACKAGE_ID,
      secretKey: NETWORK === 'localnet' ? PRIVATEKEY : undefined,
      metadata: contractMetadata as SuiMoveNormalizedModules,
    });
    this.dubhe = dubhe;
    this.network = NETWORK;

    this.graphqlClient = new DubheGraphqlClient({
      endpoint: this.endpoint.http,
      dubheMetadata,
    });
    this.grpcClient = new DubheGrpcClient({
      baseUrl: this.endpoint.grpc,
    });
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

  // public async signAndExecuteTransaction({
  //   tx,
  //   onSuccess,
  //   onError,
  // }: {
  //   tx: Transaction;
  //   onSuccess?: (result: SuiTransactionBlockResponse) => void;
  //   onError?: (error: Error) => void;
  // }): Promise<SuiTransactionBlockResponse | null> {
  //   try {
  //     if (this.network === 'localnet') {
  //       console.log('sui address', this.dubhe.getAddress());
  //       return await this.dubhe.signAndSendTxn({
  //         tx,
  //         onSuccess,
  //         onError,
  //       });
  //     }

  //     if (!window.customWallet || !window.customWallet.isConnected) {
  //       console.error('Wallet not connected, please connect first');
  //       return null;
  //     }

  //     return await window.customWallet.signAndExecuteTransaction({
  //       tx,
  //       onSuccess,
  //       onError,
  //     });
  //   } catch (error) {
  //     console.error('Transaction execution failed:', error);
  //     return null;
  //   }
  // }

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

        const chain = 'sui';
        const sender = this.dubhe.getAddress();
        const nonce = Date.now(); // Use timestamp as nonce
        const ptb = tx.getData();

        // Prepare API request payload
        const payload = {
          chain,
          sender,
          nonce,
          ptb,
          signature: 'base64_encoded_signature_placeholder',
        };

        console.log('Submitting transaction to API:', payload);

        // Submit transaction via API
        const response = await fetch(`${this.endpoint.grpc}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API request failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('Transaction submitted successfully:', result);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
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
      if (onError && error instanceof Error) {
        onError(error);
      }
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

  public getEndpoint(): { http: string; ws: string; grpc: string } {
    return this.endpoint;
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
