/**
 * Optimized Vite configuration for production builds
 * Includes advanced optimization features
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@contexts': resolve(__dirname, './src/contexts'),
      '@config': resolve(__dirname, './src/config'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },

  build: {
    // Output directory
    outDir: 'dist',
    
    // Enable source maps for production debugging
    sourcemap: true,
    
    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        unused: true,
        // Optimize loops
        loops: true,
        // Optimize conditionals
        conditionals: true,
      },
      mangle: {
        // Mangle variable names
        toplevel: true,
        safari10: true,
      },
    },
    
    // Rollup options for advanced optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'chart-vendor': ['recharts', 'chart.js'],
          'utils-vendor': ['lodash', 'date-fns', 'clsx'],
          
          // Feature chunks
          'dashboard': [
            './src/pages/ModernDashboardPage',
            './src/components/modern/ModernDashboard',
            './src/components/charts'
          ],
          'analytics': [
            './src/pages/Analytics',
            './src/components/modern/ModernAnalytics',
            './src/hooks/useOptimizedDashboardData'
          ],
          'transactions': [
            './src/pages/Transactions',
            './src/components/modern/ModernTransactions',
            './src/components/forms/TransactionForm'
          ],
          'admin': [
            './src/pages/AdminManagement',
            './src/components/admin',
            './src/components/modern/ModernAdminManagement'
          ],
        },
        
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
      
      // External dependencies (if using CDN)
      external: [],
    },
    
    // Target modern browsers
    target: ['es2015', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4kb
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000, // 1MB
  },

  // Development server optimization
  server: {
    // Enable compression
    compress: true,
    
    // Optimize HMR
    hmr: {
      overlay: true,
    },
    
    // Pre-transform dependencies
    preTransformRequests: true,
  },

  // CSS optimization
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: 'camelCase',
    },
    
    // PostCSS configuration
    postcss: './postcss.config.js',
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'swr',
      '@headlessui/react',
      '@heroicons/react',
      'recharts',
      'clsx',
      'date-fns',
    ],
    
    // Exclude large dependencies that should be loaded separately
    exclude: ['chart.js'],
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Performance optimizations
  esbuild: {
    // Remove console logs in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    
    // Optimize JSX
    jsxInject: `import React from 'react'`,
  },
});
