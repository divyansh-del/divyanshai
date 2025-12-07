
import { AppDefinition, AppConnection } from '../types';
import { FunctionDeclaration, Type } from '@google/genai';

// ==========================================
// CONFIGURATION
// ==========================================
// Once you deploy your backend (Render/Railway), put the URL here.
// e.g., 'https://chatbharat-backend.onrender.com'
const BACKEND_URL = ''; 

// ==========================================
// 1. APPS REGISTRY (JSON SCHEMA)
// ==========================================
const APP_REGISTRY: AppDefinition[] = [
    {
        app_id: 'youtube',
        display_name: 'YouTube',
        logo_icon: 'Play',
        description: 'Search videos, manage playlists, and get channel stats.',
        color: 'bg-red-600',
        auth_type: 'oauth2',
        oauth: {
            client_id: 'mock_yt_client',
            auth_url: 'https://accounts.google.com/o/oauth2/auth',
            token_url: 'https://oauth2.googleapis.com/token',
            scopes: ['youtube.readonly', 'youtube.force-ssl']
        },
        actions: [
            {
                name: 'search_video',
                description: 'Search for YouTube videos by query',
                method: 'GET',
                endpoint: 'https://www.googleapis.com/youtube/v3/search',
                params: [
                    { name: 'query', type: 'string', required: true, description: 'The search term' },
                    { name: 'maxResults', type: 'number', required: false, description: 'Max videos to return' }
                ]
            }
        ]
    },
    {
        app_id: 'gmail',
        display_name: 'Gmail',
        logo_icon: 'Mail',
        description: 'Read unread emails, send drafts, and manage labels.',
        color: 'bg-red-500',
        auth_type: 'oauth2',
        oauth: {
            client_id: 'mock_gmail_client',
            auth_url: 'https://accounts.google.com/o/oauth2/auth',
            token_url: 'https://oauth2.googleapis.com/token',
            scopes: ['https://mail.google.com/']
        },
        actions: [
            {
                name: 'list_unread_emails',
                description: 'Get a list of recent unread emails',
                method: 'GET',
                endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
                params: [
                   { name: 'limit', type: 'number', required: false, description: 'Number of emails to fetch' }
                ]
            }
        ]
    },
    {
        app_id: 'google_drive',
        display_name: 'Google Drive',
        logo_icon: 'HardDrive',
        description: 'Access files, upload documents, and manage folders.',
        color: 'bg-green-600',
        auth_type: 'oauth2',
        oauth: {
            client_id: 'mock_drive_client',
            auth_url: 'https://accounts.google.com/o/oauth2/auth',
            token_url: 'https://oauth2.googleapis.com/token',
            scopes: ['https://www.googleapis.com/auth/drive.readonly']
        },
        actions: [
            {
                name: 'list_files',
                description: 'List files in Google Drive',
                method: 'GET',
                endpoint: 'https://www.googleapis.com/drive/v3/files',
                params: [
                    { name: 'query', type: 'string', required: false, description: 'Search query' }
                ]
            }
        ]
    },
    {
        app_id: 'canva',
        display_name: 'Canva',
        logo_icon: 'PenTool',
        description: 'Create designs, upload assets, and manage content.',
        color: 'bg-blue-600',
        auth_type: 'oauth2',
        oauth: {
            client_id: 'mock_canva_client',
            auth_url: 'https://www.canva.com/oauth/authorize',
            token_url: 'https://api.canva.com/oauth/token',
            scopes: ['design:read', 'design:write', 'profile:read', 'asset:write']
        },
        actions: [
            {
                name: 'get_user_profile',
                description: 'Get details about the connected Canva user (account info)',
                method: 'GET',
                endpoint: 'https://api.canva.com/v1/users/me',
                params: []
            },
            {
                name: 'search_templates',
                description: 'Search for Canva design templates',
                method: 'GET',
                endpoint: 'https://api.canva.com/v1/templates',
                params: [
                    { name: 'query', type: 'string', required: true, description: 'Design topic (e.g. presentation, instagram post)' }
                ]
            },
            {
                name: 'list_designs',
                description: 'List recent designs created by the user',
                method: 'GET',
                endpoint: 'https://api.canva.com/v1/designs',
                params: [
                    { name: 'limit', type: 'number', required: false, description: 'Max designs to return' }
                ]
            },
            {
                name: 'create_design',
                description: 'Create a new design or generate one from a template. Returns an editor URL.',
                method: 'POST',
                endpoint: 'https://api.canva.com/v1/designs',
                params: [
                    { name: 'type', type: 'string', required: true, description: 'Type of design (presentation, social_media, poster, resume)' },
                    { name: 'title', type: 'string', required: false, description: 'Title of the new design' }
                ]
            },
            {
                name: 'upload_asset',
                description: 'Upload an image or file to the user\'s Canva assets library',
                method: 'POST',
                endpoint: 'https://api.canva.com/v1/assets',
                params: [
                    { name: 'file_url', type: 'string', required: true, description: 'URL of the file to upload' },
                    { name: 'name', type: 'string', required: false, description: 'Name of the asset' }
                ]
            }
        ]
    },
    {
        app_id: 'instagram',
        display_name: 'Instagram',
        logo_icon: 'Camera',
        description: 'Post media, get insights, and manage comments.',
        color: 'bg-pink-600',
        auth_type: 'oauth2',
        oauth: {
            client_id: 'mock_ig_client',
            auth_url: 'https://api.instagram.com/oauth/authorize',
            token_url: 'https://api.instagram.com/oauth/access_token',
            scopes: ['instagram_basic', 'instagram_content_publish']
        },
        actions: [
            {
                name: 'get_user_insights',
                description: 'Get basic insights about the user account',
                method: 'GET',
                endpoint: 'https://graph.instagram.com/me',
                params: []
            }
        ]
    }
];

// ==========================================
// 2. MOCK DATABASE (LocalStorage)
// ==========================================
const DB_KEY = 'chatbharat_app_connections';

const getDB = (): AppConnection[] => {
    try {
        return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveDB = (data: AppConnection[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// ==========================================
// 3. OAUTH CONTROLLER (Simulation)
// ==========================================

export const getRegistry = () => APP_REGISTRY;

export const getConnectedApps = () => {
    const db = getDB();
    // Return full app definitions that are connected
    return APP_REGISTRY.filter(app => db.some(conn => conn.app_id === app.app_id));
};

export const isAppConnected = (appId: string) => {
    const db = getDB();
    return db.some(c => c.app_id === appId);
};

export const getBackendStatus = () => {
    return BACKEND_URL ? 'Real Backend Mode' : 'Simulation Mode';
};

export const checkBackendHealth = async (): Promise<boolean> => {
    if (!BACKEND_URL) return false;
    try {
        const res = await fetch(`${BACKEND_URL}/health`);
        return res.ok;
    } catch {
        return false;
    }
};

export const connectApp = async (appId: string, email: string = 'user@example.com'): Promise<boolean> => {
    const app = APP_REGISTRY.find(a => a.app_id === appId);
    if (!app) return false;

    console.group(`[OAuth Flow] Connecting to ${app.display_name}`);
    
    // Step 1: Backend generates Auth URL
    console.log(`1. Backend constructs Auth URL: ${app.oauth.auth_url}?client_id=${app.oauth.client_id}&redirect_uri=${window.location.origin}/oauth/callback/${appId}&state=xyz`);
    
    // Step 2: User Redirect (Simulated)
    console.log(`2. User redirected to ${app.display_name} login page...`);
    
    // Simulate Network Login Time
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Step 3: Callback & Code Exchange
    console.log(`3. User Authorized. ${app.display_name} redirects to Callback URL with code=AUTH_CODE_123`);
    console.log(`4. Backend exchanging code for tokens at ${app.oauth.token_url}...`);

    const mockToken = `access_token_${appId}_${Date.now()}`;
    const mockRefreshToken = `refresh_token_${appId}_${Date.now()}`;

    // Step 4: Save to DB
    console.log(`5. Saving tokens to secure database.`);
    
    const newConnection: AppConnection = {
        user_id: 'current_user',
        app_id: appId,
        access_token: mockToken,
        refresh_token: mockRefreshToken,
        expires_at: Date.now() + 3600 * 1000,
        scope: app.oauth.scopes,
        updated_at: Date.now(),
        connected_email: email
    };

    const db = getDB();
    const existingIndex = db.findIndex(c => c.app_id === appId);
    if (existingIndex >= 0) {
        db[existingIndex] = newConnection;
    } else {
        db.push(newConnection);
    }
    saveDB(db);

    console.log(`[Success] Connection established for ${app.display_name} as ${email}`);
    console.groupEnd();
    return true;
};

export const disconnectApp = (appId: string) => {
    const db = getDB();
    const filtered = db.filter(c => c.app_id !== appId);
    saveDB(filtered);
    console.log(`[OAuth] Disconnected ${appId}. Tokens removed from DB.`);
};

// ==========================================
// 4. ACTIONS ENGINE & API SIMULATOR
// ==========================================

// Helper to get connected email
const getConnectedEmail = (appId: string) => {
    const db = getDB();
    const conn = db.find(c => c.app_id === appId);
    return conn?.connected_email || 'user@example.com';
};

const executeMockApiCall = async (appId: string, action: string, params: any) => {
    console.log(`[API CALL] App: ${appId} | Action: ${action} | Params:`, params);
    
    // Simulate Network Latency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userEmail = getConnectedEmail(appId);

    switch (appId) {
        case 'youtube':
            if (action === 'search_video') {
                const q = encodeURIComponent(params.query);
                // Return Real Search Link
                return {
                    results_link: `https://www.youtube.com/results?search_query=${q}`,
                    top_matches: [
                        { title: `Watch: ${params.query}`, link: `https://www.youtube.com/results?search_query=${q}` }
                    ]
                };
            }
            break;
        case 'gmail':
            if (action === 'list_unread_emails') {
                return {
                    account: userEmail,
                    inbox_link: 'https://mail.google.com/mail/u/0/#inbox',
                    message: "Click the link above to view your unread emails directly."
                };
            }
            break;
        case 'canva':
            if (action === 'search_templates') {
                const q = encodeURIComponent(params.query);
                return {
                    templates_link: `https://www.canva.com/search/templates?q=${q}`,
                    message: `Found templates for "${params.query}". Click the link to view them.`
                };
            }
            if (action === 'get_user_profile') {
                return {
                    user: {
                        name: 'ChatBharat User',
                        email: userEmail,
                        account_type: 'Pro',
                        team_id: 'team_12345'
                    }
                };
            }
            if (action === 'list_designs') {
                return {
                    account: userEmail,
                    projects_link: 'https://www.canva.com/projects',
                    designs: [
                        { id: 'des_1', title: 'Recent Design 1', edit_url: 'https://www.canva.com/projects' },
                        { id: 'des_2', title: 'Recent Design 2', edit_url: 'https://www.canva.com/projects' }
                    ]
                };
            }
            if (action === 'create_design') {
                const type = params.type.toLowerCase();
                let url = 'https://www.canva.com/create';
                
                if (type.includes('presentation')) url = 'https://www.canva.com/create/presentations';
                else if (type.includes('poster')) url = 'https://www.canva.com/create/posters';
                else if (type.includes('social')) url = 'https://www.canva.com/create/social-media-posts';
                else if (type.includes('video')) url = 'https://www.canva.com/create/videos';
                else if (type.includes('resume')) url = 'https://www.canva.com/create/resumes';
                
                return {
                    status: 'success',
                    message: `Opening Canva Editor for ${params.type}...`,
                    editor_url: url
                };
            }
            if (action === 'upload_asset') {
                return {
                    status: 'success',
                    message: `To upload assets, please use the Canva Uploads interface directly.`,
                    upload_link: 'https://www.canva.com/folder/uploads'
                };
            }
            break;
        case 'instagram':
             if (action === 'get_user_insights') {
                 return {
                     account: userEmail,
                     followers: 12500,
                     following: 300,
                     posts: 45,
                     engagement_rate: '4.5%'
                 };
             }
             break;
        case 'google_drive':
            if (action === 'list_files') {
                return {
                    account: userEmail,
                    drive_link: 'https://drive.google.com/drive/my-drive',
                    files: [
                        { id: 'f1', name: 'Project Proposal.pdf', type: 'application/pdf' },
                        { id: 'f2', name: 'Financials.xlsx', type: 'application/vnd.google-apps.spreadsheet' }
                    ]
                };
            }
            break;
    }
    return { status: 'success', message: 'Action executed successfully', data: {} };
};

const executeRealBackendCall = async (appId: string, action: string, params: any) => {
    // This function will be used once BACKEND_URL is set
    try {
        const response = await fetch(`${BACKEND_URL}/api/${appId}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
        return await response.json();
    } catch (e) {
        console.error("Backend Call Failed", e);
        return { error: "Backend connection failed. Falling back to simulation." };
    }
};

// Main Entry point for the AI
export const executeAppAction = async (toolName: string, args: any) => {
    // Tool name format: "appId_actionName" (e.g., "youtube_search_video")
    const parts = toolName.split('_');
    const appId = parts[0];
    const actionName = parts.slice(1).join('_');

    // 1. Verify Token
    const db = getDB();
    const connection = db.find(c => c.app_id === appId);
    
    if (!connection) {
        return { error: `App ${appId} is not connected. Please connect it in Settings > Apps.` };
    }

    // 2. Refresh Token if needed (Simulation)
    if (Date.now() > connection.expires_at) {
        console.log(`[Token] Refreshing token for ${appId}...`);
        connection.expires_at = Date.now() + 3600 * 1000;
        saveDB(db);
    }

    // 3. Execute API (Hybrid: Real Backend if available, else Mock)
    if (BACKEND_URL) {
        return await executeRealBackendCall(appId, actionName, args);
    } else {
        return await executeMockApiCall(appId, actionName, args);
    }
};

// ==========================================
// 5. TOOL GENERATOR FOR GEMINI
// ==========================================

export const getGeminiTools = (): FunctionDeclaration[] => {
    const connected = getConnectedApps();
    const tools: FunctionDeclaration[] = [];

    connected.forEach(app => {
        app.actions.forEach(action => {
            const paramsSchema: {[key: string]: any} = {};
            const requiredParams: string[] = [];

            action.params.forEach(p => {
                paramsSchema[p.name] = {
                    type: p.type === 'number' ? Type.NUMBER : Type.STRING,
                    description: p.description
                };
                if (p.required) requiredParams.push(p.name);
            });

            tools.push({
                name: `${app.app_id}_${action.name}`,
                description: `[App: ${app.display_name}] ${action.description}`,
                parameters: {
                    type: Type.OBJECT,
                    properties: paramsSchema,
                    required: requiredParams
                }
            });
        });
    });

    return tools;
};