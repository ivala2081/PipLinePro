/**
 * Bundle Fix - Fixes the wrong API URL in bundle.min.js
 */
(function() {
    'use strict';
    
    // Function to fix fetch calls with wrong URL and data format
    function fixBundleUrls() {
        // Override fetch to intercept calls to wrong URL
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
            // Fix the wrong URL
            if (url === '/api/psp-allocation') {
                url = '/api/psp-allocations';
            }
            
            // Fix data format if it's a PSP allocation request
            if (url === '/api/psp-allocations' && options && options.body) {
                try {
                    const data = JSON.parse(options.body);
                    // Convert bundle format to our expected format
                    if (data.date && data.psp && data.value !== undefined) {
                        const fixedData = {
                            date: data.date,
                            psp: data.psp,
                            allocation: data.value
                        };
                        options.body = JSON.stringify(fixedData);
                    }
                } catch (e) {
                    // If parsing fails, leave as is
                }
            }
            
            return originalFetch.call(this, url, options);
        };
    }
    
    // Run the fix immediately
    fixBundleUrls();
    
    // Also run it after DOM is loaded to catch any late calls
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixBundleUrls);
    } else {
        fixBundleUrls();
    }
    
    // Run it after window load to be extra sure
    window.addEventListener('load', fixBundleUrls);
})(); 

// Enhanced page tracking and reload functionality
(function() {
    'use strict';
    
    // Store current page in sessionStorage for reload functionality
    function trackCurrentPage() {
        // Only track for authenticated users (check if user menu exists)
        if (document.querySelector('.user-menu') || document.querySelector('.dropdown-toggle')) {
            const currentPath = window.location.pathname;
            
            // Don't track certain paths
            const excludedPaths = ['/static/', '/api/', '/health/', '/favicon.ico'];
            const shouldTrack = !excludedPaths.some(path => currentPath.startsWith(path));
            
            if (shouldTrack && currentPath !== '/') {
                sessionStorage.setItem('lastPage', currentPath);
                sessionStorage.setItem('lastPageTimestamp', Date.now().toString());
            }
        }
    }
    
    // Restore last page on page load
    function restoreLastPage() {
        const lastPage = sessionStorage.getItem('lastPage');
        const lastPageTimestamp = sessionStorage.getItem('lastPageTimestamp');
        
        if (lastPage && lastPageTimestamp) {
            const now = Date.now();
            const timeDiff = now - parseInt(lastPageTimestamp);
            
            // Only restore if the last page was visited within the last 30 minutes
            if (timeDiff < 30 * 60 * 1000) {
                // Check if we're on the root page and should redirect
                if (window.location.pathname === '/') {
                    window.location.href = lastPage;
                }
            }
        }
    }
    
    // Handle page visibility changes (when user switches tabs and comes back)
    function handleVisibilityChange() {
        if (!document.hidden) {
            // User came back to the tab, update the current page
            trackCurrentPage();
        }
    }
    
    // Handle beforeunload event (when user is about to leave the page)
    function handleBeforeUnload() {
        trackCurrentPage();
    }
    
    // Initialize page tracking
    function initPageTracking() {
        // Track current page on page load
        trackCurrentPage();
        
        // Restore last page if needed
        restoreLastPage();
        
        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Track page changes for single-page app behavior
        let currentUrl = window.location.href;
        const observer = new MutationObserver(function() {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                trackCurrentPage();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageTracking);
    } else {
        initPageTracking();
    }
    
    // Expose functions globally for debugging
    window.pageTracking = {
        trackCurrentPage: trackCurrentPage,
        restoreLastPage: restoreLastPage,
        getLastPage: () => sessionStorage.getItem('lastPage'),
        clearLastPage: () => {
            sessionStorage.removeItem('lastPage');
            sessionStorage.removeItem('lastPageTimestamp');
        }
    };
    
})(); 