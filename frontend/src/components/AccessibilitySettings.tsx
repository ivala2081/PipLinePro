import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Type, 
  Palette, 
  Volume2, 
  MousePointer,
  Sun,
  Moon,
  Monitor,
  Settings,
  X
} from 'lucide-react';

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  focusIndicator: boolean;
  theme: 'light' | 'dark' | 'auto';
}

const AccessibilitySettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: 'medium',
    reducedMotion: false,
    focusIndicator: true,
    theme: 'auto'
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse accessibility settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Apply settings to document
    applySettings(settings);
    
    // Save settings to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    
    // High contrast
    if (newSettings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${newSettings.fontSize}`);
    
    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Focus indicator
    if (newSettings.focusIndicator) {
      root.classList.add('focus-indicator');
    } else {
      root.classList.remove('focus-indicator');
    }
    
    // Theme
    if (newSettings.theme === 'dark') {
      root.classList.add('dark');
    } else if (newSettings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto theme - respect system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleSettingChange = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      fontSize: 'medium',
      reducedMotion: false,
      focusIndicator: true,
      theme: 'auto'
    };
    setSettings(defaultSettings);
  };

  return (
    <>
      {/* Accessibility Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 z-40"
        aria-label="Open accessibility settings"
      >
        <Settings className="w-6 h-6 mx-auto" />
      </button>

      {/* Accessibility Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Accessibility</h2>
                  <p className="text-sm text-gray-600">Customize your experience</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close accessibility settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* High Contrast */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">High Contrast</h3>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.highContrast}
                    onChange={(e) => handleSettingChange('highContrast', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable high contrast mode</span>
                </label>
              </div>

              {/* Font Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Font Size</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSettingChange('fontSize', size)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        settings.fontSize === size
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MousePointer className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Reduced Motion</h3>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) => handleSettingChange('reducedMotion', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Reduce animations and motion</span>
                </label>
              </div>

              {/* Focus Indicator */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MousePointer className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Focus Indicator</h3>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.focusIndicator}
                    onChange={(e) => handleSettingChange('focusIndicator', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show focus indicators</span>
                </label>
              </div>

              {/* Theme */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <h3 className="font-medium text-gray-900">Theme</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['light', 'dark', 'auto'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleSettingChange('theme', theme)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        settings.theme === theme
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {theme === 'light' ? <Sun className="w-4 h-4 mx-auto" /> : 
                       theme === 'dark' ? <Moon className="w-4 h-4 mx-auto" /> : 
                       <Monitor className="w-4 h-4 mx-auto" />}
                      <span className="block mt-1">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={resetSettings}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilitySettings;
