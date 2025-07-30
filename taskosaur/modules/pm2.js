const pm2 = require('pm2');
const path = require('path');

/**
 * Start a PM2 process
 */
async function startPm2Process(name, script, cwd, env = {}) {
    return new Promise((resolve, reject) => {
        console.log(`🔄 Starting ${name}...`);
        pm2.start({
            name,
            script,
            cwd: path.join(process.cwd(), cwd),
            env: { ...process.env, ...env },
            watch: false,
            autorestart: true,
            max_memory_restart: '1G'
        }, (err) => {
            if (err) {
                console.error(`❌ Failed to start ${name}:`, err);
                reject(err);
            } else {
                console.log(`🚀 Started ${name}`);
                resolve();
            }
        });
    });
}

/**
 * Connect to PM2
 */
async function connectPm2() {
    return new Promise((resolve, reject) => {
        pm2.connect((err) => {
            if (err) {
                console.error('Error connecting to PM2:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Delete all PM2 processes
 */
async function deleteAllProcesses() {
    return new Promise((resolve) => {
        pm2.delete('all', (deleteErr) => {
            if (deleteErr) {
                console.log('No existing processes to delete');
            }
            resolve();
        });
    });
}

/**
 * Stream logs from PM2 processes
 */
async function streamLogs() {
    return new Promise((resolve) => {
        pm2.launchBus((err, bus) => {
            if (err) {
                console.error('Error launching PM2 bus:', err);
                return;
            }

            console.log('\n📋 Streaming logs (Ctrl+C to stop):\n');

            bus.on('log:out', (packet) => {
                console.log(`[${packet.process.name}] ${packet.data}`);
            });

            bus.on('log:err', (packet) => {
                console.error(`[${packet.process.name}] ERROR: ${packet.data}`);
            });

            bus.on('process:event', (packet) => {
                if (packet.event === 'exit') {
                    console.log(`[${packet.process.name}] Process exited`);
                }
            });
        });
    });
}

/**
 * Stop all PM2 processes and kill daemon
 */
async function stopAllProcesses() {
    return new Promise((resolve) => {
        console.log('\n🛑 Shutting down...');
        pm2.stop('all', (err) => {
            if (err) {
                console.error('Error stopping processes:', err);
            }
            pm2.killDaemon(() => {
                console.log('✅ All processes stopped');
                resolve();
            });
        });
    });
}

/**
 * Start all Taskosaur services (backend, frontend, proxy)
 */
async function startAllServices(config, isDev = false) {
    try {
        await connectPm2();
        await deleteAllProcesses();

        const backendScript = isDev ? 'npm run start:dev' : 'npm run start:prod';
        const frontendScript = isDev ? 'npm run dev' : 'npm run start';

        const backendPromise = startPm2Process(
            'backend',
            backendScript,
            'backend',
            {
                BE_UNIX_SOCKET: config.BE_UNIX_SOCKET,
                BE_SOCKET_PATH: config.BE_SOCKET_PATH,
                PORT: config.APP_BE_PORT,
                HOST: config.APP_BE_HOST,
                NODE_ENV: isDev ? 'development' : 'production',
            }
        );

        const frontendPromise = startPm2Process(
            'frontend', 
            frontendScript,
            'frontend',
            {
                FE_UNIX_SOCKET: config.FE_UNIX_SOCKET,
                FE_SOCKET_PATH: config.FE_SOCKET_PATH,
                PORT: config.APP_FE_PORT,
                HOST: config.APP_FE_HOST,
                NODE_ENV: isDev ? 'development' : 'production',
            }
        );

        const proxyPromise = startPm2Process(
            'proxy',
            'node proxy.js',
            '.',
            { 
                APP_HOST: config.APP_HOST,
                APP_PORT: config.APP_PORT,
                APP_BE_HOST: config.APP_BE_HOST,
                APP_BE_PORT: config.APP_BE_PORT,
                APP_FE_HOST: config.APP_FE_HOST,
                APP_FE_PORT: config.APP_FE_PORT,
                FE_UNIX_SOCKET: config.FE_UNIX_SOCKET,
                BE_UNIX_SOCKET: config.BE_UNIX_SOCKET,
                FE_SOCKET_PATH: config.FE_SOCKET_PATH,
                BE_SOCKET_PATH: config.BE_SOCKET_PATH
            }
        );

        await Promise.all([backendPromise, frontendPromise, proxyPromise]);

        console.log('\n✅ All services started successfully!');
        console.log(`🔗 Proxy: http://${config.APP_HOST}:${config.APP_PORT}`);
        console.log(`🌐 Frontend: Unix socket at ${config.FE_SOCKET_PATH}`);
        console.log(`🔙 Backend: Unix socket at ${config.BE_SOCKET_PATH}\n`);

        return true;
    } catch (error) {
        console.error('Error starting services:', error);
        throw error;
    }
}

module.exports = {
    startPm2Process,
    connectPm2,
    deleteAllProcesses,
    streamLogs,
    stopAllProcesses,
    startAllServices
};