const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

/**
 * Generate a random 64-character alphanumeric string for JWT secrets
 * Uses base64 character set but only alphanumeric (0-9, a-z, A-Z) - no symbols
 */
function generateJwtSecret() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    
    // Generate 64 characters using alphanumeric characters only
    for (let i = 0; i < 64; i++) {
        const randomIndex = crypto.randomBytes(1)[0] % chars.length;
        result += chars[randomIndex];
    }
    
    return result;
}

/**
 * Ask user a question and return the answer
 */
function askQuestion(rl, question, defaultValue = '') {
    return new Promise((resolve) => {
        const prompt = defaultValue ? `${question} (${defaultValue}): ` : `${question}: `;
        rl.question(prompt, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

/**
 * Create root .env file with Global Configuration
 */
async function createRootEnv(rl) {
    const rootEnvPath = path.join(process.cwd(), '.env');
    
    // Check if root .env already exists
    if (fs.existsSync(rootEnvPath)) {
        console.log('ℹ️  Global .env file already exists, skipping setup...');
        
        // Read existing .env file and parse global config
        try {
            const envContent = fs.readFileSync(rootEnvPath, 'utf8');
            const globalConfig = {};
            
            // Parse the existing .env file for global config values
            const lines = envContent.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('GLOBAL_APP_HOST=')) {
                    globalConfig.GLOBAL_APP_HOST = trimmedLine.split('=')[1];
                } else if (trimmedLine.startsWith('GLOBAL_APP_PORT=')) {
                    globalConfig.GLOBAL_APP_PORT = trimmedLine.split('=')[1];
                }
            }
            
            // Return parsed values or defaults
            return {
                GLOBAL_APP_HOST: globalConfig.GLOBAL_APP_HOST || '127.0.0.1',
                GLOBAL_APP_PORT: globalConfig.GLOBAL_APP_PORT || '9100'
            };
        } catch (error) {
            console.warn('⚠️  Failed to parse existing .env file, using defaults');
            return {
                GLOBAL_APP_HOST: '127.0.0.1',
                GLOBAL_APP_PORT: '9100'
            };
        }
    }
    
    try {
        console.log('\n🌐 Setting up global configuration...\n');
        
        const globalConfig = {};
        
        console.log('🌍 Global Application Settings:');
        globalConfig.GLOBAL_APP_HOST = await askQuestion(
            rl, 
            'Global App Host', 
            '127.0.0.1'
        );
        globalConfig.GLOBAL_APP_PORT = await askQuestion(
            rl, 
            'Global App Port', 
            '9100'
        );
        
        console.log('\n🔧 Unix Socket Configuration:');
        const useFeUnixSocket = await askQuestion(
            rl, 
            'Use Frontend Unix Socket? (1 for yes, 0 for no)', 
            '1'
        );
        globalConfig.GLOBAL_FE_UNIX_SOCKET = useFeUnixSocket;
        
        const useBeUnixSocket = await askQuestion(
            rl, 
            'Use Backend Unix Socket? (1 for yes, 0 for no)', 
            '1'
        );
        globalConfig.GLOBAL_BE_UNIX_SOCKET = useBeUnixSocket;
        
        // Only ask for host/port if not using unix sockets
        if (useFeUnixSocket === '0') {
            globalConfig.GLOBAL_APP_FE_HOST = await askQuestion(
                rl, 
                'Frontend Host', 
                '127.0.0.1'
            );
            globalConfig.GLOBAL_APP_FE_PORT = await askQuestion(
                rl, 
                'Frontend Port', 
                '9101'
            );
        }
        
        if (useBeUnixSocket === '0') {
            globalConfig.GLOBAL_APP_BE_HOST = await askQuestion(
                rl, 
                'Backend Host', 
                '127.0.0.1'
            );
            globalConfig.GLOBAL_APP_BE_PORT = await askQuestion(
                rl, 
                'Backend Port', 
                '9102'
            );
        }
        
        // Generate root .env content
        const rootEnvContent = [
            '#### Global Configuration >>>>>',
            `GLOBAL_APP_HOST=${globalConfig.GLOBAL_APP_HOST}`,
            `GLOBAL_APP_PORT=${globalConfig.GLOBAL_APP_PORT}`,
        ];
        
        if (globalConfig.GLOBAL_APP_FE_HOST) {
            rootEnvContent.push(`GLOBAL_APP_FE_HOST=${globalConfig.GLOBAL_APP_FE_HOST}`);
        } else {
            rootEnvContent.push('# GLOBAL_APP_FE_HOST=127.0.0.1 # Use when FE_UNIX_SOCKET=0');
        }
        
        if (globalConfig.GLOBAL_APP_FE_PORT) {
            rootEnvContent.push(`GLOBAL_APP_FE_PORT=${globalConfig.GLOBAL_APP_FE_PORT}`);
        } else {
            rootEnvContent.push('# GLOBAL_APP_FE_PORT=9101 # Use when FE_UNIX_SOCKET=0');
        }
        
        if (globalConfig.GLOBAL_APP_BE_HOST) {
            rootEnvContent.push(`GLOBAL_APP_BE_HOST=${globalConfig.GLOBAL_APP_BE_HOST}`);
        } else {
            rootEnvContent.push('# GLOBAL_APP_BE_HOST=127.0.0.1 # Use when BE_UNIX_SOCKET=0');
        }
        
        if (globalConfig.GLOBAL_APP_BE_PORT) {
            rootEnvContent.push(`GLOBAL_APP_BE_PORT=${globalConfig.GLOBAL_APP_BE_PORT}`);
        } else {
            rootEnvContent.push('# GLOBAL_APP_BE_PORT=9102 # Use when BE_UNIX_SOCKET=0');
        }
        
        rootEnvContent.push(
            `GLOBAL_FE_UNIX_SOCKET=${globalConfig.GLOBAL_FE_UNIX_SOCKET}`,
            `GLOBAL_BE_UNIX_SOCKET=${globalConfig.GLOBAL_BE_UNIX_SOCKET}`,
            '# GLOBAL_FE_SOCKET_PATH=/path/to/frontend/tmp/taskosaur-frontend.sock',
            '# GLOBAL_BE_SOCKET_PATH=/path/to/backend/tmp/taskosaur-backend.sock',
            '#### Global Configuration <<<<<',
            ''
        );
        
        // Write to root .env
        fs.writeFileSync(rootEnvPath, rootEnvContent.join('\n'));
        
        console.log('\n✅ Root .env file created successfully!');
        console.log(`📁 Location: ${rootEnvPath}`);
        
        // Return the global config for use in backend env
        return globalConfig;
        
    } catch (error) {
        console.error('❌ Failed to create root .env file:', error.message);
        throw error;
    }
}

/**
 * Create backend .env file by asking interactive questions
 */
async function createBackendEnv(rl, globalConfig = null) {
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    
    // Check if backend .env already exists
    if (fs.existsSync(backendEnvPath)) {
        console.log('ℹ️  Backend .env file already exists, skipping setup...');
        return;
    }
    
    try {
        console.log('\n🔧 Setting up backend environment configuration...\n');
        
        // Backend Configuration questions based on .env.example
        const config = {};
        
        console.log('📊 Database Configuration:');
        const dbHost = await askQuestion(
            rl, 
            'Database Host', 
            'localhost'
        );
        const dbPort = await askQuestion(
            rl, 
            'Database Port', 
            '5432'
        );
        const dbUsername = await askQuestion(
            rl, 
            'Database Username', 
            'your-db-username'
        );
        const dbPassword = await askQuestion(
            rl, 
            'Database Password', 
            'your-db-password'
        );
        const dbName = await askQuestion(
            rl, 
            'Database Name', 
            'taskosaur'
        );
        
        // Construct DATABASE_URL from components
        config.DATABASE_URL = `postgresql://${dbUsername}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        
        console.log('\n🔐 Authentication:');
        const defaultJwtSecret = generateJwtSecret();
        const defaultJwtRefreshSecret = generateJwtSecret();
        
        config.JWT_SECRET = await askQuestion(
            rl, 
            'JWT Secret Key', 
            defaultJwtSecret
        );
        config.JWT_REFRESH_SECRET = await askQuestion(
            rl, 
            'JWT Refresh Secret Key', 
            defaultJwtRefreshSecret
        );
        config.JWT_EXPIRES_IN = await askQuestion(
            rl, 
            'JWT Expiration Time', 
            '15m'
        );
        config.JWT_REFRESH_EXPIRES_IN = await askQuestion(
            rl, 
            'JWT Refresh Expiration Time', 
            '7d'
        );
        
        console.log('\n🔴 Redis Configuration:');
        config.REDIS_HOST = await askQuestion(
            rl, 
            'Redis Host', 
            'localhost'
        );
        config.REDIS_PORT = await askQuestion(
            rl, 
            'Redis Port', 
            '6379'
        );
        config.REDIS_PASSWORD = await askQuestion(
            rl, 
            'Redis Password (leave empty if none)', 
            ''
        );
        
        console.log('\n📧 Email Configuration:');
        config.SMTP_HOST = await askQuestion(
            rl, 
            'SMTP Host', 
            'smtp.gmail.com'
        );
        config.SMTP_PORT = await askQuestion(
            rl, 
            'SMTP Port', 
            '587'
        );
        config.SMTP_USER = await askQuestion(
            rl, 
            'SMTP User (email address)', 
            'your-email@gmail.com'
        );
        config.SMTP_PASS = await askQuestion(
            rl, 
            'SMTP Password (app password)', 
            'your-app-password'
        );
        config.SMTP_FROM = await askQuestion(
            rl, 
            'From Email Address', 
            'noreply@taskosaur.com'
        );
        
        console.log('\n🌐 Frontend Configuration:');
        const defaultFrontendUrl = globalConfig 
            ? `http://${globalConfig.GLOBAL_APP_HOST}:${globalConfig.GLOBAL_APP_PORT}`
            : 'http://127.0.0.1:9100';
        config.FRONTEND_URL = await askQuestion(
            rl, 
            'Frontend URL', 
            defaultFrontendUrl
        );
        
        console.log('\n📁 File Upload Configuration:');
        config.UPLOAD_DEST = await askQuestion(
            rl, 
            'Upload Destination Directory', 
            './uploads'
        );
        config.MAX_FILE_SIZE = await askQuestion(
            rl, 
            'Maximum File Size (bytes)', 
            '10485760'
        );
        
        console.log('\n⚙️ Queue Configuration:');
        config.MAX_CONCURRENT_JOBS = await askQuestion(
            rl, 
            'Maximum Concurrent Jobs', 
            '5'
        );
        config.JOB_RETRY_ATTEMPTS = await askQuestion(
            rl, 
            'Job Retry Attempts', 
            '3'
        );
        
        // Generate .env content
        const envContent = [
            '#### Backend Configuration >>>>>',
            `DATABASE_URL="${config.DATABASE_URL}"`,
            '',
            '# Authentication',
            `JWT_SECRET="${config.JWT_SECRET}"`,
            `JWT_REFRESH_SECRET="${config.JWT_REFRESH_SECRET}"`,
            `JWT_EXPIRES_IN="${config.JWT_EXPIRES_IN}"`,
            `JWT_REFRESH_EXPIRES_IN="${config.JWT_REFRESH_EXPIRES_IN}"`,
            '',
            '# Redis Configuration (for Bull Queue)',
            `REDIS_HOST=${config.REDIS_HOST}`,
            `REDIS_PORT=${config.REDIS_PORT}`,
            `REDIS_PASSWORD=${config.REDIS_PASSWORD}`,
            '',
            '# Email Configuration (for notifications)',
            `SMTP_HOST=${config.SMTP_HOST}`,
            `SMTP_PORT=${config.SMTP_PORT}`,
            `SMTP_USER=${config.SMTP_USER}`,
            `SMTP_PASS=${config.SMTP_PASS}`,
            `SMTP_FROM=${config.SMTP_FROM}`,
            '',
            '# Frontend URL (for email links)',
            `FRONTEND_URL=${config.FRONTEND_URL}`,
            '',
            '# File Upload',
            `UPLOAD_DEST="${config.UPLOAD_DEST}"`,
            `MAX_FILE_SIZE=${config.MAX_FILE_SIZE}`,
            '',
            '# Queue Configuration',
            `MAX_CONCURRENT_JOBS=${config.MAX_CONCURRENT_JOBS}`,
            `JOB_RETRY_ATTEMPTS=${config.JOB_RETRY_ATTEMPTS}`,
            '#### Backend Configuration <<<<<',
            ''
        ].join('\n');
        
        // Write to backend/.env
        fs.writeFileSync(backendEnvPath, envContent);
        
        console.log('\n✅ Backend .env file created successfully!');
        console.log(`📁 Location: ${backendEnvPath}`);
        
    } catch (error) {
        console.error('❌ Failed to create backend .env file:', error.message);
        throw error;
    }
}

/**
 * Create both root and backend .env files
 */
async function createEnvFiles() {
    const rootEnvPath = path.join(process.cwd(), '.env');
    const backendEnvPath = path.join(process.cwd(), 'backend', '.env');
    
    // Check if both files already exist
    if (fs.existsSync(rootEnvPath) && fs.existsSync(backendEnvPath)) {
        console.log('ℹ️  Both global and backend .env files already exist, skipping environment setup...');
        return;
    }
    
    const rl = createReadlineInterface();
    
    try {
        // Create root .env file with Global Configuration
        const globalConfig = await createRootEnv(rl);
        
        // Create backend .env file with Backend Configuration
        await createBackendEnv(rl, globalConfig);
        
        console.log('\n🎉 Environment setup completed!');
        
    } catch (error) {
        console.error('❌ Failed to create environment files:', error.message);
        throw error;
    } finally {
        rl.close();
    }
}

module.exports = {
    createBackendEnv,
    createRootEnv,
    createEnvFiles
};