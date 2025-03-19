self.addEventListener('install', () => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Take control of all open tabs
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Get the current URL
    const url = new URL(event.request.url);
    // Catch collection requests
    if (url.pathname.includes('/data/gtag/js')) {
        // Modify the request path
        url.pathname = url.pathname.replace('/gtag/js', '/script.js');
        // Clone and modify the request
        const request = new Request(url, event.request);
        // Fetch the modified request
        event.respondWith(
            fetch(request).catch((error) => {
                return new Response(null, { status: 502 });
            })
        );
    }
    // Catch collection requests
    if (url.pathname.includes('/data/g/collect')) {
        // Modify the request path
        url.pathname = url.pathname.replace('/g/collect', '/event');
        // Encode the query parameters
        url.pathname = url.pathname.concat(
            `/${btoa(url.searchParams.toString())}`
        );
        // Reset the query parameters
        url.search = '';
        // Clone and modify the request
        const request = new Request(url, event.request);
        // Fetch the modified request
        event.respondWith(
            fetch(request).catch((error) => {
                return new Response(null, { status: 502 });
            })
        );
    }
});
