
import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { AppSettings, AppDefinition } from '../types';
import { getRegistry, isAppConnected, connectApp, disconnectApp, getBackendStatus } from '../services/appsService';
import SettingsSidebar, { SettingsTab } from './SettingsSidebar';
import SettingsPage from './SettingsPage';

interface SettingsModalProps {
  onClose: () => void;
  onLogout?: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  isDarkMode: boolean;
  onClearAllData: () => void; // New Prop
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onLogout, settings, onUpdateSettings, isDarkMode, onClearAllData }) => {
  const [activeTab, setActiveTab] = React.useState<SettingsTab>('General');
  const [connectingAppId, setConnectingAppId] = useState<string | null>(null);
  
  // Login Simulation State
  const [loginApp, setLoginApp] = useState<AppDefinition | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa'>('credentials');
  const [twoFACode, setTwoFACode] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Apps List State
  const [connectedApps, setConnectedApps] = useState<AppDefinition[]>([]);
  const [availableApps, setAvailableApps] = useState<AppDefinition[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadApps = () => {
        const registry = getRegistry();
        const connected = registry.filter(app => isAppConnected(app.app_id));
        const available = registry.filter(app => !isAppConnected(app.app_id));
        setConnectedApps(connected);
        setAvailableApps(available);
    };
    
    if (activeTab === 'Apps') {
        loadApps();
    }
  }, [activeTab, refreshKey]);

  // Dynamic Theme Classes
  const bgMain = isDarkMode ? 'bg-gray-950' : 'bg-white';
  const borderClass = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const textMain = isDarkMode ? 'text-white' : 'text-gray-900';

  const handleInitiateConnect = (app: AppDefinition) => {
      setLoginApp(app);
      setLoginEmail('');
      setLoginPassword('');
      setLoginStep('credentials');
      setTwoFACode('');
      setLoginError(null);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginApp) return;
      
      setLoginError(null);
      setIsAuthorizing(true);

      setTimeout(() => {
          setIsAuthorizing(false);
          // Basic Validation Mock
          if (loginPassword.length < 6 || loginPassword.toLowerCase() === 'password' || loginPassword === '123456') {
              setLoginError("Incorrect password. Please try again.");
              return;
          }
          setLoginStep('2fa');
      }, 1500);
  };

  const handleFinalizeConnect = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginApp) return;

      if (twoFACode.length !== 6) {
          setLoginError("Invalid code. Please enter the 6-digit code.");
          return;
      }

      setIsAuthorizing(true);
      setConnectingAppId(loginApp.app_id);
      
      await connectApp(loginApp.app_id, loginEmail || 'user@example.com');
      
      setConnectingAppId(null);
      setLoginApp(null);
      setIsAuthorizing(false);
      setRefreshKey(prev => prev + 1);
  };

  const handleDisconnect = (appId: string) => {
      if(confirm('Are you sure you want to disconnect this app? ChatBharat will no longer be able to perform actions on your behalf.')) {
          disconnectApp(appId);
          setRefreshKey(prev => prev + 1);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl border flex overflow-hidden relative ${bgMain} ${borderClass}`}>
        
        {/* Left Sidebar */}
        <SettingsSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isDarkMode={isDarkMode} 
        />

        {/* Content Area */}
        <div className={`flex-1 flex flex-col ${bgMain}`}>
            <div className={`p-6 md:p-8 border-b flex justify-between items-center ${borderClass} ${bgMain}`}>
                <h3 className={`text-xl font-bold tracking-tight ${textMain}`}>
                    {activeTab === 'Apps' ? 'Apps & Connectors' : activeTab}
                </h3>
                <button 
                    onClick={onClose} 
                    className={`p-2 rounded-full transition-all transform hover:rotate-90 ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}`}
                >
                    <Icons.Plus className="w-6 h-6 rotate-45" />
                </button>
            </div>
            
            <div className={`flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative ${bgMain}`}>
                <SettingsPage 
                    activeTab={activeTab}
                    onLogout={onLogout}
                    connectedApps={connectedApps}
                    availableApps={availableApps}
                    connectingAppId={connectingAppId}
                    onInitiateConnect={handleInitiateConnect}
                    onDisconnect={handleDisconnect}
                    backendStatus={getBackendStatus()}
                    onClearAllData={onClearAllData}
                />
            </div>
        </div>
      </div>

      {/* LOGIN SIMULATION MODAL */}
      {loginApp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className={`w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden`}>
                  {/* ... (Login Modal content same as before) ... */}
                  <div className={`h-2 w-full ${loginApp.color}`}></div>
                  <div className="p-8">
                      <div className="flex justify-center mb-6">
                           <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl ${loginApp.color}`}>
                               {Icons[loginApp.logo_icon as keyof typeof Icons] ? React.createElement(Icons[loginApp.logo_icon as keyof typeof Icons] as React.ElementType, {className: "w-8 h-8"}) : loginApp.display_name[0]}
                           </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Log in with {loginApp.display_name}</h3>
                      <p className="text-center text-sm text-gray-500 mb-6">ChatBharat Ultra is requesting access to your account.</p>

                      {loginError && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-xs font-bold animate-pulse">
                              <Icons.XCircle className="w-4 h-4 mr-2" />
                              {loginError}
                          </div>
                      )}
                      
                      {loginStep === 'credentials' ? (
                        <form onSubmit={handleCredentialsSubmit}>
                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email or Username</label>
                                    <input 
                                        type="email"
                                        required
                                        autoFocus
                                        value={loginEmail}
                                        onChange={e => setLoginEmail(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Password</label>
                                    <input 
                                        type="password"
                                        required
                                        value={loginPassword}
                                        onChange={e => setLoginPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setLoginApp(null)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isAuthorizing}
                                    className={`flex-1 py-3 text-sm font-bold text-white rounded-lg transition-colors flex items-center justify-center ${loginApp.color} opacity-90 hover:opacity-100`}
                                >
                                    {isAuthorizing ? (
                                        <>
                                            <Icons.RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                            Verifying...
                                        </>
                                    ) : 'Sign In'}
                                </button>
                            </div>
                        </form>
                      ) : (
                          <form onSubmit={handleFinalizeConnect}>
                              <div className="mb-6 text-center">
                                  <div className="inline-block p-3 rounded-full bg-blue-50 text-blue-500 mb-3">
                                      <Icons.Smartphone className="w-6 h-6" />
                                  </div>
                                  <h4 className="text-sm font-bold text-gray-800">2-Step Verification</h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                      Google sent a notification to your phone. Tap <strong>Yes</strong> on the prompt or enter the verification code.
                                  </p>
                              </div>

                              <div className="mb-8">
                                  <label className="block text-xs font-bold text-center text-gray-700 mb-2 uppercase">Enter 6-digit code</label>
                                  <input 
                                      type="text"
                                      maxLength={6}
                                      autoFocus
                                      value={twoFACode}
                                      onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                      className="w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                      placeholder="000000"
                                  />
                              </div>

                              <div className="flex space-x-3">
                                  <button 
                                      type="button"
                                      onClick={() => setLoginStep('credentials')}
                                      className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                      Back
                                  </button>
                                  <button 
                                      type="submit"
                                      disabled={isAuthorizing}
                                      className={`flex-1 py-3 text-sm font-bold text-white rounded-lg transition-colors flex items-center justify-center ${loginApp.color} opacity-90 hover:opacity-100`}
                                  >
                                      {isAuthorizing ? <Icons.RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
                                  </button>
                              </div>
                          </form>
                      )}
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center text-gray-400">
                          <Icons.Lock className="w-3 h-3 mr-1.5" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Secured by OAuth 2.0</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsModal;
