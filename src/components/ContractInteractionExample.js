import React from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { base } from 'wagmi/chains'
import { isReownInitialized } from '../lib/reownConfig'

/**
 * Example component demonstrating enhanced contract interactions with Reown AppKit
 * Shows best practices for reading from and writing to smart contracts
 */
function ContractInteractionExample() {
  const { address, isConnected, connector, chain } = useAccount()
  
  // Example: Reading from a contract
  const { 
    data: contractData, 
    isLoading: isReading, 
    error: readError 
  } = useReadContract({
    address: '0xff9760f655b3fcf73864def142df2a551c38f15e', // Your puzzle contract
    abi: [
      "function getScoresCount() external view returns (uint256)"
    ],
    functionName: 'getScoresCount',
    chainId: base.id,
  })

  // Example: Writing to a contract
  const { 
    writeContract, 
    data: writeHash, 
    isPending: isWriting,
    error: writeError 
  } = useWriteContract()

  // Wait for transaction confirmation
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash: writeHash,
  })

  const handleExampleWrite = () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (chain?.id !== base.id) {
      alert('Please switch to Base network')
      return
    }

    // Example contract write - replace with your actual function
    writeContract({
      address: '0xff9760f655b3fcf73864def142df2a551c38f15e',
      abi: [
        "function submitScore(uint256 time, string memory username, uint256 puzzleId, uint256 fid) external"
      ],
      functionName: 'submitScore',
      args: [1000, 'TestUser', 1, 0], // Example args
    })
  }

  const getConnectionInfo = () => {
    if (!isConnected) return 'Not connected'
    
    const walletType = connector?.name || 'Unknown'
    const networkName = chain?.name || 'Unknown'
    const reownStatus = isReownInitialized ? 'Enhanced' : 'Basic'
    
    return `${walletType} on ${networkName} (${reownStatus} mode)`
  }

  const formatAddress = (addr) => {
    if (!addr) return 'N/A'
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      maxWidth: '400px',
      margin: '16px auto'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        color: '#333',
        textAlign: 'center'
      }}>
        Contract Interaction Example
      </h3>

      {/* Connection Status */}
      <div style={{
        backgroundColor: isConnected ? '#e8f5e8' : '#ffe8e8',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '16px',
        fontSize: '12px'
      }}>
        <div><strong>Status:</strong> {getConnectionInfo()}</div>
        <div><strong>Address:</strong> {formatAddress(address)}</div>
        <div><strong>Network:</strong> {chain?.name || 'Not connected'}</div>
      </div>

      {/* Read Contract Example */}
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1976d2' }}>
          📖 Reading Contract
        </h4>
        <div style={{ fontSize: '12px' }}>
          <div><strong>Function:</strong> getScoresCount()</div>
          <div><strong>Result:</strong> {
            isReading ? 'Loading...' : 
            readError ? 'Error reading' : 
            contractData ? contractData.toString() : 'No data'
          }</div>
          {readError && (
            <div style={{ color: '#d32f2f', marginTop: '4px' }}>
              Error: {readError.message}
            </div>
          )}
        </div>
      </div>

      {/* Write Contract Example */}
      <div style={{
        backgroundColor: '#fff3e0',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '12px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f57c00' }}>
          ✍️ Writing to Contract
        </h4>
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          <div><strong>Function:</strong> submitScore()</div>
          <div><strong>Status:</strong> {
            isWriting ? 'Sending...' :
            isConfirming ? 'Confirming...' :
            isConfirmed ? 'Confirmed!' :
            'Ready'
          }</div>
        </div>
        
        <button
          onClick={handleExampleWrite}
          disabled={!isConnected || isWriting || isConfirming}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            backgroundColor: '#f57c00',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            opacity: (!isConnected || isWriting || isConfirming) ? 0.6 : 1
          }}
        >
          {isWriting ? 'Sending...' : 
           isConfirming ? 'Confirming...' : 
           'Test Write'}
        </button>

        {writeError && (
          <div style={{ 
            color: '#d32f2f', 
            marginTop: '8px', 
            fontSize: '11px',
            wordBreak: 'break-word'
          }}>
            Error: {writeError.message}
          </div>
        )}

        {confirmError && (
          <div style={{ 
            color: '#d32f2f', 
            marginTop: '8px', 
            fontSize: '11px',
            wordBreak: 'break-word'
          }}>
            Confirmation Error: {confirmError.message}
          </div>
        )}

        {isConfirmed && writeHash && (
          <div style={{ 
            color: '#2e7d32', 
            marginTop: '8px', 
            fontSize: '11px',
            wordBreak: 'break-word'
          }}>
            ✅ Transaction confirmed: {writeHash.slice(0, 10)}...
          </div>
        )}
      </div>

      {/* Network Warning */}
      {isConnected && chain?.id !== base.id && (
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#856404'
        }}>
          ⚠️ Please switch to Base network for contract interactions
        </div>
      )}

      {/* Enhancement Notice */}
      <div style={{
        fontSize: '10px',
        color: '#666',
        textAlign: 'center',
        marginTop: '12px',
        padding: '8px',
        backgroundColor: isReownInitialized ? '#e8f5e8' : '#fff3cd',
        borderRadius: '4px'
      }}>
        {isReownInitialized ? 
          '✨ Enhanced mode with Reown AppKit' : 
          '💡 Add Reown Project ID for enhanced features'
        }
      </div>
    </div>
  )
}

export default ContractInteractionExample