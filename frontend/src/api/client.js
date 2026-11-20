
const API_BASE = '/api';


// ==================================================
// 1. ACCESS TOKEN MANAGEMENT
// ==================================================

let accessToken = localStorage.getItem('token') || '';

export function setAccessToken(token) {
    accessToken = token || '';

    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }
}

export function getAccessToken() {
    return accessToken;
}


// ==================================================
// 2. EXPIRE SESSION
// ==================================================

function expireSession() {
    setAccessToken('');

    window.dispatchEvent(new Event('auth:expired'));

    throw new Error('Session expired. Please login again.');
}


// ==================================================
// 3. SEND REQUEST TO BACKEND
// ==================================================

async function rawRequest(path, options = {}) {

    const headers = { ...options.headers };

    // Set JSON header for normal requests
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // Add access token
    if (accessToken) {
        headers.Authorization = 'Bearer ' + accessToken;
    }

    let response;

    try {
        response = await fetch(API_BASE + path, {
            credentials: 'include',
            ...options,
            headers: headers
        });
    } catch (error) {
        throw new Error('Server is not reachable.');
    }

    const data = await response.json().catch(() => ({}));

    return {
        response: response,
        data: data
    };
}


// ==================================================
// 4. HANDLE REQUEST AND TOKEN REFRESH
// ==================================================

async function request(path, options = {}, retry = true) {

    let result = await rawRequest(path, options);

    let response = result.response;
    let data = result.data;

    // Check whether access token has expired
    if (
        response.status === 401 &&
        retry &&
        path !== '/auth/refresh' &&
        path !== '/auth/login' &&
        path !== '/auth/register'
    ) {

        // Request a new access token
        const refresh = await rawRequest('/auth/refresh', {
            method: 'POST'
        });

        if (refresh.response.ok && refresh.data.accessToken) {

            setAccessToken(refresh.data.accessToken);

            // Send the original request again
            result = await rawRequest(path, options);

            response = result.response;
            data = result.data;

            if (response.status === 401) {
                expireSession();
            }

        } else if (refresh.response.status === 401) {
            expireSession();

        } else if (refresh.response.ok) {
            throw new Error('Invalid access token.');
        }
    }

    // Check errors
    if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
    }

    return data;
}


// ==================================================
// 5. COMMON API METHODS
// ==================================================

export const api = {

    get: function(path) {
        return request(path);
    },

    post: function(path, body) {
        return request(path, {
            method: 'POST',
            body: JSON.stringify(body || {})
        });
    },

    put: function(path, body) {
        return request(path, {
            method: 'PUT',
            body: JSON.stringify(body || {})
        });
    },

    del: function(path) {
        return request(path, {
            method: 'DELETE'
        });
    }
};


// ==================================================
// 6. AUTHENTICATION API
// ==================================================

export const authApi = {

    login: function(email, password) {
        return api.post('/auth/login', {
            email: email,
            password: password
        });
    },

    register: function(name, email, password) {
        return api.post('/auth/register', {
            name: name,
            email: email,
            password: password
        });
    },

    me: function() {
        return api.get('/auth/me');
    },

    logout: function() {
        return api.post('/auth/logout', {});
    },

    refresh: function() {
        return api.post('/auth/refresh', {});
    },

    profile: function(body) {
        return api.put('/auth/profile', body);
    },

    changePassword: function(body) {
        return api.post('/auth/change-password', body);
    }
};


// ==================================================
// 7. TRIPS API
// ==================================================

export const tripsApi = {

    list: function() {
        return api.get('/trips');
    },

    create: function(trip) {
        return api.post('/trips', trip);
    },

    update: function(id, trip) {
        return api.put('/trips/' + id, trip);
    },

    remove: function(id) {
        return api.del('/trips/' + id);
    }
};


// ==================================================
// 8. WISHLIST API
// ==================================================

export const wishlistApi = {

    list: function() {
        return api.get('/wishlist');
    },

    add: function(item) {
        return api.post('/wishlist', item);
    },

    remove: function(id) {
        return api.del('/wishlist/' + id);
    }
};


// ==================================================
// 9. HISTORY API
// ==================================================

export const historyApi = {

    list: function() {
        return api.get('/history');
    },

    add: function(item) {
        return api.post('/history', item);
    },

    update: function(id, item) {
        return api.put('/history/' + id, item);
    },

    remove: function(id) {
        return api.del('/history/' + id);
    }
};


// ==================================================
// 10. REVIEWS API
// ==================================================

export const reviewsApi = {

    list: function(destinationKey) {
        let path = '/reviews';

        if (destinationKey) {
            path += '?destinationKey=' + encodeURIComponent(destinationKey);
        }

        return api.get(path);
    },

    add: function(item) {
        return api.post('/reviews', item);
    },

    update: function(id, item) {
        return api.put('/reviews/' + id, item);
    },

    remove: function(id) {
        return api.del('/reviews/' + id);
    }
};


// ==================================================
// 11. SEARCH HISTORY API
// ==================================================

export const searchHistoryApi = {

    list: function() {
        return api.get('/search-history');
    },

    add: function(query, filters) {
        return api.post('/search-history', {
            query: query,
            filters: filters
        });
    }
};


// ==================================================
// 12. PACKING API
// ==================================================

export const packingApi = {

    list: function() {
        return api.get('/packing');
    },

    generate: function(payload) {
        return api.post('/packing/generate', payload);
    },

    save: function(item) {
        return api.post('/packing', item);
    },

    update: function(id, item) {
        return api.put('/packing/' + id, item);
    },

    remove: function(id) {
        return api.del('/packing/' + id);
    }
};


// ==================================================
// 13. NOTIFICATIONS API
// ==================================================

export const notificationsApi = {

    list: function() {
        return api.get('/notifications');
    },

    read: function(id) {
        return api.put('/notifications/' + id + '/read', {});
    }
};


// ==================================================
// 14. DASHBOARD API
// ==================================================

export const dashboardApi = {

    get: function() {
        return api.get('/dashboard');
    }
};


// ==================================================
// 15. BOOKINGS API
// ==================================================

export const bookingsApi = {

    list: function() {
        return api.get('/bookings');
    },

    create: function(item) {
        return api.post('/bookings', item);
    },

    cancel: function(id) {
        return api.del('/bookings/' + id);
    }
};


// ==================================================
// 16. QUERY PARAMETERS
// ==================================================

function toQuery(params = {}) {

    const searchParams = new URLSearchParams();

    for (const key in params) {

        const value = params[key];

        if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, value);
        }
    }

    return searchParams.toString();
}


// ==================================================
// 17. DESTINATIONS API
// ==================================================

export const destinationsApi = {

    search: function(params = {}) {
        return api.get('/destinations/search?' + toQuery(params));
    },

    autocomplete: function(q, limit = 8) {
        return api.get('/destinations/autocomplete?' + toQuery({
            q: q,
            limit: limit
        }));
    },

    categories: function() {
        return api.get('/destinations/categories');
    },

    filters: function() {
        return api.get('/destinations/filters');
    },

    popular: function(limit = 8) {
        return api.get('/destinations/popular?' + toQuery({
            limit: limit
        }));
    },

    trending: function(limit = 8) {
        return api.get('/destinations/trending?' + toQuery({
            limit: limit
        }));
    },

    get: function(identifier) {
        return api.get('/destinations/' + encodeURIComponent(identifier));
    },

    details: function(params = {}) {
        return api.get('/destinations/details?' + toQuery(params));
    },

    attractionDetails: function(params = {}) {
        return api.get('/destinations/attraction?' + toQuery(params));
    },

    geocode: function(q) {
        return api.get('/destinations/geocode?' + toQuery({
            q: q
        }));
    },

    nearbyPlaces: function(params = {}) {
        return api.get('/destinations/nearby-places?' + toQuery(params));
    },

    nearbyHotels: function(params = {}) {
        return api.get('/destinations/nearby-hotels?' + toQuery(params));
    }
};


// ==================================================
// 18. RECENTLY VIEWED API
// ==================================================

export const recentlyViewedApi = {

    list: function(limit = 12) {
        return api.get('/destinations/recently-viewed?' + toQuery({
            limit: limit
        }));
    },

    record: function(slug) {
        return api.post('/destinations/recently-viewed', {
            slug: slug
        });
    },

    remove: function(id) {
        return api.del('/destinations/recently-viewed/' + id);
    },

    clear: function() {
        return api.del('/destinations/recently-viewed');
    }
};


// ==================================================
// 19. ROUTES API
// ==================================================

export const routesApi = {

    compare: function(body) {
        return api.post('/routes/compare', body);
    }
};
