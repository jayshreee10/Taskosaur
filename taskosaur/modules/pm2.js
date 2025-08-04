const pm2 = require('pm2');
const path = require('path');

/**
 * Filter out undefined or empty environment variables
 */
function filterEnvVars(envObj) {
    const filtered = {};
    for (const [key, value] of Object.entries(envObj)) {
        if (value !== undefined && value !== null && value !== '') {
            filtered[key] = value;
        }
    }
    return filtered;
}

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

        const backendScript = isDev ? 'node taskosaur.js be:npm run start:dev -- --preserveWatchOutput' : 'node taskosaur.js be:npm run start:prod';
        const frontendScript = isDev ? 'node taskosaur.js fe:npm run dev -- --preserveWatchOutput' : 'node taskosaur.js fe:npm run start';

        const backendPromise = startPm2Process(
            'backend',
            backendScript,
            '.'
        );

        const frontendPromise = startPm2Process(
            'frontend', 
            frontendScript,
            '.'
        );

        const proxyPromise = startPm2Process(
            'proxy',
            'node proxy.js',
            '.',
            filterEnvVars({ 
                APP_HOST: config.APP_HOST,
                APP_PORT: config.APP_PORT,
                BE_HOST: config.BE_HOST,
                BE_PORT: config.BE_PORT,
                FE_HOST: config.FE_HOST,
                FE_PORT: config.FE_PORT,
                FE_UNIX_SOCKET: config.FE_UNIX_SOCKET,
                BE_UNIX_SOCKET: config.BE_UNIX_SOCKET,
                FE_UNIX_SOCKET_PATH: config.FE_UNIX_SOCKET_PATH,
                BE_UNIX_SOCKET_PATH: config.BE_UNIX_SOCKET_PATH
            })
        );

        await Promise.all([backendPromise, frontendPromise, proxyPromise]);

        console.log('\n✅ All services started successfully!');
        console.log(`🔗 Proxy: http://${config.APP_HOST}:${config.APP_PORT}`);
        console.log(`🌐 Frontend: Unix socket at ${config.FE_UNIX_SOCKET_PATH}`);
        console.log(`🔙 Backend: Unix socket at ${config.BE_UNIX_SOCKET_PATH}\n`);

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