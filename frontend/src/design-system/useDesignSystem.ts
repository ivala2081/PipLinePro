import { useState, useEffect } from 'react';
import { designTokens, componentTokens, themeVariants } from './design-tokens';

// Hook for managing design system state and theme
export const useDesignSystem = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isDark, setIsDark] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setIsDark(systemTheme === 'dark');
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      setIsDark(theme === 'dark');
      root.classList.toggle('dark', theme === 'dark');
    }
    
    // Save theme preference
    localStorage.setItem('design-system-theme', theme);
  }, [theme]);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('design-system-theme') as 'light' | 'dark' | 'system';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined
  }, [theme]);

  return {
    theme,
    setTheme,
    isDark,
    tokens: designTokens,
    componentTokens,
    themeVariants: themeVariants[isDark ? 'dark' : 'light'],
  };
};

// Hook for consistent spacing
export const useSpacing = () => {
  return {
    space: (size: keyof typeof designTokens.spacing) => designTokens.spacing[size],
    padding: (size: keyof typeof designTokens.spacing) => `p-${size}`,
    margin: (size: keyof typeof designTokens.spacing) => `m-${size}`,
    gap: (size: keyof typeof designTokens.spacing) => `gap-${size}`,
  };
};

// Hook for consistent colors
export const useColors = () => {
  return {
    primary: (shade: keyof typeof designTokens.colors.primary) => designTokens.colors.primary[shade],
    secondary: (shade: keyof typeof designTokens.colors.secondary) => designTokens.colors.secondary[shade],
    success: (shade: keyof typeof designTokens.colors.success) => designTokens.colors.success[shade],
    warning: (shade: keyof typeof designTokens.colors.warning) => designTokens.colors.warning[shade],
    error: (shade: keyof typeof designTokens.colors.error) => designTokens.colors.error[shade],
    neutral: (shade: keyof typeof designTokens.colors.neutral) => designTokens.colors.neutral[shade],
  };
};

// Hook for consistent typography
export const useTypography = () => {
  return {
    fontFamily: designTokens.typography.fontFamily,
    fontSize: (size: keyof typeof designTokens.typography.fontSize) => designTokens.typography.fontSize[size],
    fontWeight: (weight: keyof typeof designTokens.typography.fontWeight) => designTokens.typography.fontWeight[weight],
    lineHeight: (height: keyof typeof designTokens.typography.lineHeight) => designTokens.typography.lineHeight[height],
  };
};

// Hook for responsive design
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
};

// Hook for component variants
export const useComponentVariants = () => {
  return {
    button: {
      variants: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'warning'],
      sizes: ['sm', 'md', 'lg'],
    },
    badge: {
      variants: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
      sizes: ['sm', 'md', 'lg'],
    },
    card: {
      variants: ['default', 'outlined', 'elevated', 'flat'],
      sizes: ['sm', 'md', 'lg'],
    },
    input: {
      sizes: ['sm', 'md', 'lg'],
      types: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  };
};
