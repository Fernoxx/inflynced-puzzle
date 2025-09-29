import React from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { isReownInitialized } from '../lib/reownConfig'

function ConnectWallet() {
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()

  const connectWallet = () => {
    // If Reown is configured, open Reown modal directly
    if (isReownInitialized && window.reownAppKit && typeof window.reownAppKit.open === 'function') {
      console.log('Opening Reown AppKit modal...')
      window.reownAppKit.open()
    } else {
      console.log('Reown AppKit not available or not configured. Using Farcaster miniapp connection.')
      // For Farcaster miniapp, the connection is typically handled automatically
      // You can add any fallback connection logic here if needed
    }
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const getConnectorInfo = () => {
    if (!connector) return 'Unknown'
    if (connector.name === 'Farcaster') return 'Farcaster'
    if (connector.name === 'Coinbase Wallet') return 'Coinbase'
    if (connector.name === 'Injected') return 'Browser Wallet'
    return connector.name
  }

  if (isConnected) {
    return (
      <div className="wallet-connected" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '500' }}>
          Connected via {getConnectorInfo()}
        </div>
        <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
          {formatAddress(address)}
        </div>
        <button 
          onClick={disconnectWallet}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            backgroundColor: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <button 
        onClick={connectWallet} 
        className="connect-wallet-btn"
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '500',
          backgroundColor: '#7C65C1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#6a5bb5'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#7C65C1'}
      >
        Connect Wallet
      </button>
      {!isReownInitialized && (
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', maxWidth: '300px' }}>
          💡 Add REACT_APP_REOWN_PROJECT_ID to .env for enhanced wallet support
        </div>
      )}
    </div>
  )
}

export default ConnectWallet