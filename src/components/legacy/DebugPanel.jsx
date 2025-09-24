import React, { useState, useEffect } from 'react';
import { simpleStorage } from '../../lib/simpleStorage';

export default function DebugPanel({ currentView, user, profileCompleted }) {
  const [debugInfo, setDebugInfo] = useState({});
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const updateDebugInfo = () => {
      const userData = simpleStorage.getItem('caltrax-user');
      const hasSignedUp = simpleStorage.getItem('caltrax-signed-up');
      
      setDebugInfo({
        currentView,
        user: user ? 'YES' : 'NO',
        userEmail: user?.email || 'N/A',
        userProfile: user?.profile ? 'YES' : 'NO',
        userCalories: user?.profile?.calories || 'N/A',
        profileCompleted,
        storedUser: userData ? 'YES' : 'NO',
        storedUserEmail: userData?.email || 'N/A',
        storedUserProfile: userData?.profile ? 'YES' : 'NO',
        storedUserCalories: userData?.profile?.calories || 'N/A',
        hasSignedUp: hasSignedUp ? 'YES' : 'NO'
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [currentView, user, profileCompleted]);

  const addLog = (message) => {
    setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Override console.log to capture logs
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      if (args[0] && args[0].includes('🔍')) {
        addLog(args.join(' '));
      }
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>DEBUG PANEL</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current State:</strong><br/>
        View: <span style={{ color: currentView === 'app' ? '#00ff00' : '#ff0000' }}>{currentView}</span><br/>
        User: <span style={{ color: user ? '#00ff00' : '#ff0000' }}>{debugInfo.user}</span><br/>
        Profile: <span style={{ color: user?.profile ? '#00ff00' : '#ff0000' }}>{debugInfo.userProfile}</span><br/>
        Calories: {debugInfo.userCalories}<br/>
        Profile Completed: <span style={{ color: profileCompleted ? '#00ff00' : '#ff0000' }}>{profileCompleted ? 'YES' : 'NO'}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Storage:</strong><br/>
        Stored User: <span style={{ color: debugInfo.storedUser === 'YES' ? '#00ff00' : '#ff0000' }}>{debugInfo.storedUser}</span><br/>
        Stored Email: {debugInfo.storedUserEmail}<br/>
        Stored Profile: <span style={{ color: debugInfo.storedUserProfile === 'YES' ? '#00ff00' : '#ff0000' }}>{debugInfo.storedUserProfile}</span><br/>
        Stored Calories: {debugInfo.storedUserCalories}<br/>
        Has Signed Up: <span style={{ color: debugInfo.hasSignedUp === 'YES' ? '#00ff00' : '#ff0000' }}>{debugInfo.hasSignedUp}</span>
      </div>

      <div>
        <strong>Recent Logs:</strong><br/>
        {logs.map((log, index) => (
          <div key={index} style={{ fontSize: '10px', marginBottom: '2px' }}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
