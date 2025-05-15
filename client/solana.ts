import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, getAccount } from '@solana/spl-token';
import axios from 'axios';
import WebSocket from 'ws';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Solana connection settings
// const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'; // Replace with your RPC URL
const SOLANA_TRACKER_RPC_URL = 'https://rpc-mainnet.solanatracker.io/?api_key=72923fe2-b845-491d-804f-c0c7a805f6f5'
const connection = new Connection(SOLANA_TRACKER_RPC_URL, 'confirmed');

// Wallet instance (initialized once)
let wallet: Keypair;

// Initialize wallet from private key
function initializeWallet(): void {
    const privateKey = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!));
    wallet = Keypair.fromSecretKey(privateKey);
    console.log('Wallet initialized:', wallet.publicKey.toBase58());
}

// Get the wallet's public key
function getWalletPublicKey(): PublicKey {
    if (!wallet) throw new Error('Wallet not initialized');
    return wallet.publicKey;
}

// Get the total balance of the wallet (SOL + SPL tokens)
async function getTotalWalletBalance(): Promise<number> {
    if (!wallet) throw new Error('Wallet not initialized');
    const solBalance = await connection.getBalance(wallet.publicKey);
    return solBalance / LAMPORTS_PER_SOL; // Convert lamports to SOL
}

// Swap tokens using Solana Swap API
async function swapTokens(
    from: string,
    to: string,
    fromAmount: number,
    slippage: number = 50,
    priorityFee: number = 0.0015
): Promise<string> {
    try {
        const response = await axios.post(
            'https://api.solanatracker.io/v1/swap', // Replace with the actual API URL
            {
                from,
                to,
                fromAmount: fromAmount.toString(),
                slippage: slippage.toString(),
                payer: wallet.publicKey.toBase58(),
                priorityFee: priorityFee.toString(),
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.SOLANA_SWAP_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (response.data && response.data.transaction) {
            const transaction = Transaction.from(Buffer.from(response.data.transaction, 'base64'));
            const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
            console.log('Swap transaction successful:', signature);
            return signature;
        } else {
            throw new Error('Failed to get swap transaction from Solana Swap API');
        }
    } catch (error) {
        console.error('Error swapping tokens:', error);
        throw error;
    }
}

// Monitor and execute trades
async function monitorAndTrade(db: Database.Database): Promise<void> {
    const ws = new WebSocket('ws://your-python-server-url'); // Replace with your WebSocket server URL

    ws.on('open', () => {
        console.log('Connected to WebSocket server');
    });

    ws.on('message', async (data: string) => {
        const contract = JSON.parse(data);
        const { address, channel } = contract;

        try {
            // Buy with 10% of the total wallet balance
            const totalBalance = await getTotalWalletBalance();
            const buyAmount = totalBalance * 0.1; // 10% of total balance

            // Buy: Swap from WSOL to memecoin
            await swapTokens('WSOL_MINT_ADDRESS', address, buyAmount);

            // Store entry price and target profit/loss in the database
            const entryPrice = await fetchTokenPrice(address);
            const targetProfit = entryPrice * 1.25; // +25%
            const stopLoss = entryPrice * 0.87; // -13%

            db.prepare(`
                UPDATE contracts
                SET entry_price = ?, target_profit_percent = ?, active = 1
                WHERE address = ?
            `).run(entryPrice, 25, address);

            console.log(`Bought ${address} at ${entryPrice}`);

            // Monitor price and execute sell conditions
            while (true) {
                const currentPrice = await fetchTokenPrice(address);

                if (currentPrice >= targetProfit || currentPrice <= stopLoss) {
                    // Sell: Swap from memecoin to WSOL
                    const tokenBalance = await getTokenBalance(new PublicKey(address));
                    await swapTokens(address, 'WSOL_MINT_ADDRESS', tokenBalance);

                    // Mark position as closed in the database
                    db.prepare(`
                        UPDATE contracts
                        SET active = 0
                        WHERE address = ?
                    `).run(address);

                    console.log(`Sold ${address} at ${currentPrice}`);
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
            }
        } catch (error) {
            console.error('Error processing contract:', error);
        }
    });

    ws.on('close', () => {
        console.log('Disconnected from WebSocket server');
    });
}

// Fetch token price (replace with your implementation)
async function fetchTokenPrice(tokenAddress: string): Promise<number> {
    // Replace this with your price-fetching logic
    return Math.random() * 100; // Mock price for demonstration
}

// Fetch token balance
async function getTokenBalance(tokenMintAddress: PublicKey): Promise<number> {
    const tokenAccount = await getAssociatedTokenAddress(tokenMintAddress, wallet.publicKey);
    const accountInfo = await getAccount(connection, tokenAccount);
    return Number(accountInfo.amount);
}

// Initialize and start trading
function startTrading(): void {
    initializeWallet();
    const db = new Database('contracts.db');
    monitorAndTrade(db);
}

// Start the trading process
startTrading();