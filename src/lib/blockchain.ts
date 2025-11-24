/**
 * Blockchain configuration and utilities
 * Handles Intuition testnet connection and payment processing
 */

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Hash,
} from 'viem';
import { defineChain } from 'viem';

// Define Intuition Testnet
export const intuitionTestnet = defineChain({
  id: 13579,
  name: 'Intuition Testnet',
  network: 'intuition-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TRUST',
    symbol: 'TRUST',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.rpc.intuition.systems/http'],
    },
    public: {
      http: ['https://testnet.rpc.intuition.systems/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: 'https://testnet.explorer.intuition.systems',
    },
  },
  testnet: true,
});

// Store wallet address
export const STORE_WALLET =
  '0x871e1b7C346EdE7DB53CDeaEE3e86341Cf5ddDd5' as Address;

// Create public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(),
});

// ERC20 ABI for $TRUST token interactions
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
] as const;

// Get wallet client from browser wallet (MetaMask, etc.)
export const getWalletClient = async () => {
  if (!window.ethereum) {
    throw new Error(
      'No wallet detected. Please install MetaMask or another Web3 wallet.'
    );
  }

  const walletClient = createWalletClient({
    chain: intuitionTestnet,
    transport: custom(window.ethereum),
  });

  return walletClient;
};

// Convert amount to token units (handle decimals)
export const toTokenUnits = (amount: number, decimals: number = 18): bigint => {
  return BigInt(Math.floor(amount * 10 ** decimals));
};

// Convert from token units to decimal
export const fromTokenUnits = (
  amount: bigint,
  decimals: number = 18
): number => {
  return Number(amount) / 10 ** decimals;
};

// Verify transaction on-chain
export const verifyTransaction = async (txHash: Hash): Promise<boolean> => {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    return receipt.status === 'success';
  } catch (error) {
    console.error('Transaction verification failed:', error);
    return false;
  }
};

// Get transaction details
export const getTransactionDetails = async (txHash: Hash) => {
  try {
    const [tx, receipt] = await Promise.all([
      publicClient.getTransaction({ hash: txHash }),
      publicClient.getTransactionReceipt({ hash: txHash }),
    ]);

    return { tx, receipt };
  } catch (error) {
    console.error('Failed to get transaction details:', error);
    return null;
  }
};

// Check if wallet is connected to correct network
export const checkNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16) === intuitionTestnet.id;
  } catch {
    return false;
  }
};

// Switch to Intuition Testnet
export const switchToIntuitionNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${intuitionTestnet.id.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // Network not added, try to add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${intuitionTestnet.id.toString(16)}`,
              chainName: intuitionTestnet.name,
              nativeCurrency: intuitionTestnet.nativeCurrency,
              rpcUrls: [intuitionTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [intuitionTestnet.blockExplorers.default.url],
            },
          ],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
};
