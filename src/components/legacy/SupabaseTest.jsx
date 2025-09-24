import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

export default function SupabaseTest() {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🔍 Testing Supabase connection...');
      console.log('Environment variables:');
      console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

      // Test basic connection by trying to read from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error) {
        console.error('❌ Connection failed:', error);
        setTestResult({
          success: false,
          message: `Connection failed: ${error.message}`,
          details: error
        });
      } else {
        console.log('✅ Connection successful!');
        console.log('✅ Profiles table accessible');
        console.log('Data returned:', data);
        setTestResult({
          success: true,
          message: 'Connection successful! Profiles table is accessible.',
          data: data
        });
      }
    } catch (err) {
      console.error('❌ Test failed with exception:', err);
      setTestResult({
        success: false,
        message: `Test failed: ${err.message}`,
        details: err
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-blue-900 text-white rounded-lg border-2 border-blue-500 shadow-lg">
      <h2 className="text-lg font-bold mb-3 text-blue-200">🔗 Supabase Test</h2>
      
      <button
        onClick={testConnection}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-bold text-white shadow-lg mb-4"
      >
        {isLoading ? '🔄 Testing...' : '🚀 Test Supabase'}
      </button>

      {testResult && (
        <div className={`p-4 rounded ${testResult.success ? 'bg-green-900' : 'bg-red-900'}`}>
          <h3 className={`font-bold ${testResult.success ? 'text-green-300' : 'text-red-300'}`}>
            {testResult.success ? '✅ Success' : '❌ Failed'}
          </h3>
          <p className="mt-2">{testResult.message}</p>
          {testResult.data && (
            <div className="mt-2">
              <p className="text-sm text-gray-300">Data returned: {JSON.stringify(testResult.data)}</p>
            </div>
          )}
          {testResult.details && (
            <div className="mt-2">
              <p className="text-sm text-gray-300">Details: {JSON.stringify(testResult.details)}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-400">
        <p>Environment Variables:</p>
        <p>URL: {process.env.REACT_APP_SUPABASE_URL ? 'Present' : 'Missing'}</p>
        <p>Key: {process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}</p>
      </div>
    </div>
  );
}
