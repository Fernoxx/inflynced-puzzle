import React from 'react'
import { isReownInitialized } from '../lib/reownConfig'

/**
 * Example component showing how to use Reown AppKit's built-in web components
 * These components are automatically styled and provide consistent UX
 */
function ReownButtons() {
  // Only render if Reown is properly configured
  if (!isReownInitialized) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        Configure REACT_APP_REOWN_PROJECT_ID to see Reown components
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#f9f9f9',
      borderRadius: '8px',
      border: '1px solid #e0e0e0'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
        Reown AppKit Components
      </h4>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {/* Main connect button */}
        <appkit-button />
        
        {/* Network switcher button */}
        <appkit-network-button />
      </div>
      
      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
        These are Reown's built-in web components with automatic styling
      </div>
    </div>
  )
}

export default ReownButtons