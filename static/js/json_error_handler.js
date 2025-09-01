/**
 * Global JSON Error Handler for PipLinePro
 * This script catches and handles any JSON parsing errors on the client side
 */

(function() {
    'use strict';
    
    // Store original JSON.parse
    const originalJSONParse = JSON.parse;
    
    // Override JSON.parse to catch errors
    JSON.parse = function(text, reviver) {
        try {
            // First, try to clean the text
            let cleanedText = text;
            
            // Remove any potential problematic characters
            if (typeof text === 'string') {
                // Remove any non-printable characters
                cleanedText = text.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                
                // Handle common JSON issues
                cleanedText = cleanedText.replace(/,\s*}/g, '}');  // Remove trailing commas
                cleanedText = cleanedText.replace(/,\s*]/g, ']');  // Remove trailing commas in arrays
                
                // If the text starts with 'Client' or similar, it might be a string that needs wrapping
                if (cleanedText.trim().startsWith('Client') && !cleanedText.trim().startsWith('"')) {
                    cleanedText = '"' + cleanedText.replace(/"/g, '\\"') + '"';
                }
                
                // If it looks like a string but isn't quoted, quote it
                if (!cleanedText.startsWith('{') && !cleanedText.startsWith('[') && !cleanedText.startsWith('"')) {
                    cleanedText = '"' + cleanedText.replace(/"/g, '\\"') + '"';
                }
            }
            
            // Try to parse the cleaned text
            return originalJSONParse(cleanedText, reviver);
            
        } catch (error) {
            console.error('JSON parsing error caught and handled:', error);
            console.error('Original text:', text);
            console.error('Cleaned text:', cleanedText);
            
            // Return a safe fallback object
            return {
                error: 'JSON parsing failed',
                originalError: error.message,
                data: [],
                status: 'error'
            };
        }
    };
    
    // Override JSON.stringify to handle errors
    const originalJSONStringify = JSON.stringify;
    
    JSON.stringify = function(value, replacer, space) {
        try {
            return originalJSONStringify(value, replacer, space);
        } catch (error) {
            console.error('JSON stringify error caught and handled:', error);
            
            // Return a safe fallback
            return '{"error": "JSON stringify failed", "data": []}';
        }
    };
    
    // Global error handler for unhandled errors
    window.addEventListener('error', function(event) {
        if (event.error && event.error.message && event.error.message.includes('JSON')) {
            console.error('Global JSON error caught:', event.error);
            event.preventDefault();
            return false;
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (event.reason && event.reason.message && event.reason.message.includes('JSON')) {
            console.error('Global JSON promise rejection caught:', event.reason);
            event.preventDefault();
            return false;
        }
    });
    
    // Safe JSON parsing function for templates
    window.safeJSONParse = function(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.error('Safe JSON parse failed:', error);
            return {
                error: 'JSON parsing failed',
                data: [],
                status: 'error'
            };
        }
    };
    
    // Safe JSON stringify function
    window.safeJSONStringify = function(obj) {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.error('Safe JSON stringify failed:', error);
            return '{"error": "JSON stringify failed", "data": []}';
        }
    };
    
    console.log('JSON Error Handler loaded successfully');
    
})(); 