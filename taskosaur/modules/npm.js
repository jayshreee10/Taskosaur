const { spawn } = require('child_process');
const path = require('path');

/**
 * Run npm install in a directory
 */
async function runNpmInstall(directory) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Installing dependencies in ${directory}...`);
        const npm = spawn('npm', ['install'], { 
            cwd: path.join(process.cwd(), directory),
            stdio: 'inherit'
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Dependencies installed in ${directory}`);
                resolve();
            } else {
                reject(new Error(`npm install failed in ${directory} with code ${code}`));
            }
        });
    });
}

/**
 * Run npm build in a directory
 */
async function runNpmBuild(directory) {
    return new Promise((resolve, reject) => {
        console.log(`🔨 Building ${directory}...`);
        const npm = spawn('npm', ['run', 'build'], { 
            cwd: path.join(process.cwd(), directory),
            stdio: 'inherit'
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Build completed in ${directory}`);
                resolve();
            } else {
                reject(new Error(`npm run build failed in ${directory} with code ${code}`));
            }
        });
    });
}

/**
 * Install dependencies for both frontend and backend
 */
async function installDependencies() {
    try {
        await runNpmInstall('backend');
        await runNpmInstall('frontend');
        console.log('✅ All dependencies installed successfully!');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        throw error;
    }
}

/**
 * Build both frontend and backend
 */
async function buildProjects() {
    try {
        await runNpmBuild('backend');
        await runNpmBuild('frontend');
        console.log('✅ All projects built successfully!');
    } catch (error) {
        console.error('❌ Failed to build projects:', error.message);
        throw error;
    }
}

/**
 * Run database migrations
 */
async function runMigrations() {
    return new Promise((resolve, reject) => {
        console.log('🗃️  Running database migrations...');
        const npm = spawn('npm', ['run', 'prisma:migrate:dev'], { 
            cwd: path.join(process.cwd(), 'backend'),
            stdio: 'inherit'
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Database migrations completed');
                resolve();
            } else {
                reject(new Error(`Database migrations failed with code ${code}`));
            }
        });
    });
}

/**
 * Run database seeding
 */
async function runSeed() {
    return new Promise((resolve, reject) => {
        console.log('🌱 Seeding database...');
        const npm = spawn('npm', ['run', 'seed:core', 'seed'], { 
            cwd: path.join(process.cwd(), 'backend'),
            stdio: 'inherit'
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Database seeding completed');
                resolve();
            } else {
                reject(new Error(`Database seeding failed with code ${code}`));
            }
        });
    });
}

/**
 * Run migrations and seed
 */
async function setupDatabase() {
    try {
        await runMigrations();
        await runSeed();
        console.log('✅ Database setup completed successfully!');
    } catch (error) {
        console.error('❌ Failed to setup database:', error.message);
        throw error;
    }
}

module.exports = {
    runNpmInstall,
    runNpmBuild,
    installDependencies,
    buildProjects,
    runMigrations,
    runSeed,
    setupDatabase
};