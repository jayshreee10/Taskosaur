const { installDependencies, buildProjects } = require('../modules/npm');
const { startAllServices, streamLogs, stopAllProcesses } = require('../modules/pm2');
const { getConfig } = require('../modules/config');

/**
 * Run command - Start all Taskosaur services
 */
async function run(options = {}) {
    try {
        console.log('🔧 Starting Taskosaur...\n');
        
        const config = getConfig();
        const isDev = options.dev || false;
        
        // Install dependencies if needed
        await installDependencies();
        
        // Build projects (skip in dev mode)
        if (!isDev) {
            await buildProjects();
        }
        
        // Start all services
        await startAllServices(config, isDev);
        
        // Set up graceful shutdown
        process.on('SIGINT', async () => {
            await stopAllProcesses();
            process.exit(0);
        });
        
        // Start streaming logs
        await streamLogs();
        
    } catch (error) {
        console.error('❌ Failed to start Taskosaur:', error.message);
        process.exit(1);
    }
}

module.exports = run;