const { spawn } = require('child_process');
const path = require('path');

/**
 * Run npm commands in backend directory with BE_ prefixed environment variables stripped
 */
async function beNpm(args) {
    // Get the npm command arguments (everything after 'be:npm')
    const npmArgs = args.slice(1); // Remove 'be:npm' from args
    
    if (npmArgs.length === 0) {
        console.error('❌ No npm command provided');
        console.log('Usage: taskosaur be:npm <npm-command> [args...]');
        console.log('Example: taskosaur be:npm run start:dev');
        process.exit(1);
    }
    
    try {
        // Create environment with BE_ variables mapped to non-prefixed versions
        const backendEnv = {
            ...process.env
        };
        
        // Process all BE_ prefixed environment variables and add them without prefix
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('BE_')) {
                const unprefixedKey = key.substring(3); // Remove 'BE_' prefix
                backendEnv[unprefixedKey] = process.env[key];
            }
        });
        
        // Filter out undefined values
        Object.keys(backendEnv).forEach(key => {
            if (backendEnv[key] === undefined || backendEnv[key] === null) {
                delete backendEnv[key];
            }
        });
        
        const backendDir = path.join(process.cwd(), 'backend');
        
        console.log(`🔧 Running npm ${npmArgs.join(' ')} in backend directory...`);

        if (npmArgs.length > 2 && npmArgs[2] !== '--') {
            npmArgs.splice(2, 0, '--');
        }

        // Spawn npm process in backend directory
        const child = spawn('npm', npmArgs, {
            cwd: backendDir,
            env: backendEnv,
            stdio: 'inherit'
        });
        
        // Handle process completion
        return new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Backend npm command completed successfully');
                    resolve();
                } else {
                    console.error(`❌ Backend npm command failed with exit code ${code}`);
                    process.exit(code);
                }
            });
            
            child.on('error', (error) => {
                console.error('❌ Error running backend npm command:', error);
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('❌ Failed to run backend npm command:', error.message);
        throw error;
    }
}

module.exports = beNpm;