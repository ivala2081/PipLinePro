import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  // High contrast mode
  highContrast: boolean;
  toggleHighContrast: () => void;
  
  // Font size scaling
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  
  // Reduced motion
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  
  // Focus indicators
  showFocusIndicators: boolean;
  toggleFocusIndicators: () => void;
  
  // Screen reader announcements
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });
  
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('fontSize');
    return saved ? parseInt(saved, 10) : 100; // 100% is default
  });
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('reducedMotion') === 'true';
  });
  
  const [showFocusIndicators, setShowFocusIndicators] = useState(() => {
    return localStorage.getItem('showFocusIndicators') !== 'false'; // Default to true
  });

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Font size
    root.style.fontSize = `${fontSize}%`;
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Focus indicators
    if (showFocusIndicators) {
      root.classList.add('show-focus');
    } else {
      root.classList.remove('show-focus');
    }
  }, [highContrast, fontSize, reducedMotion, showFocusIndicators]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion.toString());
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('showFocusIndicators', showFocusIndicators.toString());
  }, [showFocusIndicators]);

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 200)); // Max 200%
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 50)); // Min 50%
  };

  const resetFontSize = () => {
    setFontSize(100);
  };

  const toggleReducedMotion = () => {
    setReducedMotion(prev => !prev);
  };

  const toggleFocusIndicators = () => {
    setShowFocusIndicators(prev => !prev);
  };

  // Screen reader announcement function
  const announce = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const value: AccessibilityContextType = {
    highContrast,
    toggleHighContrast,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    reducedMotion,
    toggleReducedMotion,
    showFocusIndicators,
    toggleFocusIndicators,
    announce,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
