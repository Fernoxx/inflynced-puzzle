// lib/client.js
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'

// Direct Alchemy client that bypasses window.ethereum
export const alchemyClient = createPublicClient({
  chain: base,
  transport: http('https://base-mainnet.g.alchemy.com/v2/Nh79Ld_o13xZoe6JCIrKF'),
})

// Helper function to get transaction receipt using direct Alchemy connection
export const getTransactionReceiptDirect = async (txHash) => {
  try {
    console.log('🔍 Getting transaction receipt via direct Alchemy connection:', txHash);
    const receipt = await alchemyClient.getTransactionReceipt({ hash: txHash });
    console.log('✅ Transaction receipt retrieved:', receipt);
    return receipt;
  } catch (error) {
    console.error('❌ Failed to get transaction receipt:', error);
    throw error;
  }
}

// Helper function to wait for transaction confirmation using direct Alchemy connection
export const waitForTransactionDirect = async (txHash, maxRetries = 30, retryDelay = 2000) => {
  console.log('⏳ Waiting for transaction confirmation via Alchemy:', txHash);
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const receipt = await getTransactionReceiptDirect(txHash);
      if (receipt && receipt.status === 'success') {
        console.log('✅ Transaction confirmed successfully!');
        return receipt;
      }
      if (receipt && receipt.status === 'reverted') {
        throw new Error('Transaction was reverted');
      }
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('not available')) {
        // Transaction not yet mined, continue waiting
        console.log(`⏳ Attempt ${i + 1}/${maxRetries}: Transaction not yet confirmed, retrying in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      throw error; // Other errors should be thrown immediately
    }
  }
  
  throw new Error('Transaction confirmation timeout - please check transaction status manually');
}