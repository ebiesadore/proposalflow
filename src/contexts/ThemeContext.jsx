import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDarkMode: false,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Check feature flag
  const isDarkModeEnabled = import.meta.env?.VITE_ENABLE_DARK_MODE === 'true';

  // CRITICAL FIX: Initialize theme from localStorage immediately (no blocking)
  const getInitialTheme = () => {
    if (!isDarkModeEnabled) return 'light';
    
    const savedTheme = localStorage.getItem('nexsys-core-theme');
    if (savedTheme && savedTheme !== 'system') {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')?.matches) {
      return 'dark';
    }
    
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  const [user, setUser] = useState(null);

  // CRITICAL FIX: Load theme preference from Supabase in BACKGROUND (non-blocking)
  useEffect(() => {
    if (!isDarkModeEnabled) return;

    const loadThemeFromSupabase = async () => {
      try {
        const { data: { user: authUser } } = await supabase?.auth?.getUser();
        setUser(authUser);

        if (authUser) {
          // User is authenticated, load theme from Supabase (background operation)
          const { data, error } = await supabase?.from('user_profiles')?.select('theme_preference')?.eq('id', authUser?.id)?.single();

          if (!error && data?.theme_preference) {
            const preference = data?.theme_preference;
            
            if (preference === 'system') {
              // Use system preference
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
              setTheme(systemPrefersDark ? 'dark' : 'light');
            } else {
              setTheme(preference);
            }
            
            // Sync to localStorage
            localStorage.setItem('nexsys-core-theme', preference);
          }
        }
      } catch (error) {
        // Silent fail - theme already loaded from localStorage
        console.warn('[ThemeContext] Background theme sync failed:', error);
      }
    };

    // Run in background - don't block app initialization
    loadThemeFromSupabase();

    // Listen for auth state changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        // User logged in, load their theme preference (background)
        try {
          const { data, error } = await supabase?.from('user_profiles')?.select('theme_preference')?.eq('id', session?.user?.id)?.single();

          if (!error && data?.theme_preference) {
            const preference = data?.theme_preference;
            
            if (preference === 'system') {
              const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)')?.matches;
              setTheme(systemPrefersDark ? 'dark' : 'light');
            } else {
              setTheme(preference);
            }
            
            localStorage.setItem('nexsys-core-theme', preference);
          }
        } catch (error) {
          console.warn('[ThemeContext] Background theme sync on auth change failed:', error);
        }
      } else {
        // User logged out, use localStorage
        const savedTheme = localStorage.getItem('nexsys-core-theme');
        if (savedTheme && savedTheme !== 'system') {
          setTheme(savedTheme);
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, [isDarkModeEnabled]);

  // Apply theme to document
  useEffect(() => {
    if (!isDarkModeEnabled) {
      document.documentElement?.classList?.remove('dark');
      return;
    }

    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList?.add('dark');
    } else {
      root.classList?.remove('dark');
    }
    
    // Save to localStorage for non-authenticated users
    if (!user) {
      localStorage.setItem('nexsys-core-theme', theme);
    }
  }, [theme, isDarkModeEnabled, user]);

  // Listen for system preference changes
  useEffect(() => {
    if (!isDarkModeEnabled) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Check if user has 'system' preference
      const savedTheme = localStorage.getItem('nexsys-core-theme');
      
      if (savedTheme === 'system' || !savedTheme) {
        setTheme(e?.matches ? 'dark' : 'light');
      }
    };

    mediaQuery?.addEventListener('change', handleChange);
    return () => mediaQuery?.removeEventListener('change', handleChange);
  }, [isDarkModeEnabled]);

  const toggleTheme = async () => {
    if (!isDarkModeEnabled) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Save to localStorage immediately
    localStorage.setItem('nexsys-core-theme', newTheme);

    // If user is authenticated, sync to Supabase (background)
    if (user) {
      try {
        const { error } = await supabase?.from('user_profiles')?.update({ theme_preference: newTheme })?.eq('id', user?.id);

        if (error) {
          console.warn('[ThemeContext] Background theme sync to Supabase failed:', error);
        }
      } catch (error) {
        console.warn('[ThemeContext] Background theme sync error:', error);
      }
    }
  };

  const value = {
    theme,
    toggleTheme,
    isDarkMode: theme === 'dark',
    isEnabled: isDarkModeEnabled,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;