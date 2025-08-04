const { spawn } = require('child_process');
const path = require('path');

/**
 * Run npm commands in frontend directory with FE_ prefixed environment variables stripped
 */
async function feNpm(args) {
    // Get the npm command arguments (everything after 'fe:npm')
    const npmArgs = args.slice(1); // Remove 'fe:npm' from args
    
    if (npmArgs.length === 0) {
        console.error('❌ No npm command provided');
        console.log('Usage: taskosaur fe:npm <npm-command> [args...]');
        console.log('Example: taskosaur fe:npm run dev');
        process.exit(1);
    }
    
    try {
        // Create environment with FE_ variables mapped to non-prefixed versions
        const frontendEnv = {
            ...process.env
        };
        
        // Process all FE_ prefixed environment variables and add them without prefix
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('FE_')) {
                const unprefixedKey = key.substring(3); // Remove 'FE_' prefix
                frontendEnv[unprefixedKey] = process.env[key];
            }
        });
        
        // Filter out undefined values
        Object.keys(frontendEnv).forEach(key => {
            if (frontendEnv[key] === undefined || frontendEnv[key] === null) {
                delete frontendEnv[key];
            }
        });
        
        const frontendDir = path.join(process.cwd(), 'frontend');
        
        console.log(`🔧 Running npm ${npmArgs.join(' ')} in frontend directory...`);

        if (npmArgs.length > 2 && npmArgs[2] !== '--') {
            npmArgs.splice(2, 0, '--');
        }

        // Spawn npm process in frontend directory
        const child = spawn('npm', npmArgs, {
            cwd: frontendDir,
            env: frontendEnv,
            stdio: 'inherit'
        });
        
        // Handle process completion
        return new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Frontend npm command completed successfully');
                    resolve();
                } else {
                    console.error(`❌ Frontend npm command failed with exit code ${code}`);
                    process.exit(code);
                }
            });
            
            child.on('error', (error) => {
                console.error('❌ Error running frontend npm command:', error);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to run frontend npm command:', error.message);
        throw error;
    }
}

module.exports = feNpm;