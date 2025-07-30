require('dotenv').config();
const path = require('path');

/**
 * Process environment variables with GLOBAL_ prefix stripped and merged
 */
function processEnvironment() {
    return {
        ...process.env,
        ...Object.keys(process.env)
            .filter(key => key.startsWith('GLOBAL_'))
            .reduce((acc, key) => {
                acc[key.replace('GLOBAL_', '')] = process.env[key];
                return acc;
            }, {})
    };
}

/**
 * Get configuration with defaults
 */
function getConfig() {
    const processedEnv = processEnvironment();
    
    const {
        APP_HOST = '127.0.0.1',
        APP_PORT = '9100',
        APP_BE_HOST = '127.0.0.1',
        APP_BE_PORT = '9101',
        APP_FE_HOST = '127.0.0.1',
        APP_FE_PORT = '9102',
        FE_UNIX_SOCKET = '1',
        BE_UNIX_SOCKET = '1',
        FE_SOCKET_PATH = path.join(process.cwd(), 'frontend', 'tmp', 'taskosaur-frontend.sock'),
        BE_SOCKET_PATH = path.join(process.cwd(), 'backend', 'tmp', 'taskosaur-backend.sock'),
    } = processedEnv;

    return {
        APP_HOST,
        APP_PORT,
        APP_BE_HOST,
        APP_BE_PORT,
        APP_FE_HOST,
        APP_FE_PORT,
        FE_UNIX_SOCKET,
        BE_UNIX_SOCKET,
        FE_SOCKET_PATH,
        BE_SOCKET_PATH,
    };
}

module.exports = {
    getConfig,
    processEnvironment
};