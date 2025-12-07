const axios = require('axios');
const querystring = require('querystring');

const AUTH_URL = 'https://www.canva.com/oauth/authorize';
const TOKEN_URL = 'https://api.canva.com/oauth/token';
const API_BASE = 'https://api.canva.com/v1';

// Basic Auth Header for Token Endpoint
const getBasicAuthHeader = () => {
    const credentials = `${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
};

exports.buildAuthUrl = (state) => {
    const params = {
        response_type: 'code',
        client_id: process.env.CANVA_CLIENT_ID,
        redirect_uri: `${process.env.BASE_URL}/oauth/callback/canva`,
        scope: 'design:content:read design:content:write design:meta:read profile:read asset:read asset:upload',
        state: state,
        // vital for getting refresh_token
        access_type: 'offline', 
        prompt: 'consent'
    };
    return `${AUTH_URL}?${querystring.stringify(params)}`;
};

exports.exchangeCode = async (code) => {
    try {
        const data = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${process.env.BASE_URL}/oauth/callback/canva`
        };

        const response = await axios.post(TOKEN_URL, querystring.stringify(data), {
            headers: {
                'Authorization': getBasicAuthHeader(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        return response.data; // access_token, refresh_token, expires_in, scope
    } catch (error) {
        console.error('Token Exchange Error:', error.response?.data || error.message);
        throw new Error('Failed to exchange code for token');
    }
};

exports.refreshToken = async (refreshToken) => {
    try {
        const data = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        const response = await axios.post(TOKEN_URL, querystring.stringify(data), {
            headers: {
                'Authorization': getBasicAuthHeader(),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Token Refresh Error:', error.response?.data || error.message);
        throw new Error('Failed to refresh token');
    }
};

// --- API WRAPPERS ---

exports.getUserProfile = async (accessToken) => {
    const res = await axios.get(`${API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return res.data;
};

exports.listTemplates = async (accessToken, query) => {
    // Note: This is an example. Canva's actual endpoint might be /v1/designs or similar
    // Check specific Canva Connect API docs for "List Designs" or "Templates"
    const res = await axios.get(`${API_BASE}/designs`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { sort_by: 'relevance', query }
    });
    return res.data;
};

exports.createDesign = async (accessToken, designType = 'presentation') => {
    const res = await axios.post(`${API_BASE}/designs`, {
        design_type: { type: designType },
        title: 'Created via ChatBharat'
    }, {
        headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });
    return res.data; // contains edit_url
};