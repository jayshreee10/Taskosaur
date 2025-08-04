const { spawn } = require('child_process');
const path = require('path');

/**
 * Run npm install using taskosaur commands
 */
async function runTaskosaurNpmInstall(service) {
    return new Promise((resolve, reject) => {
        console.log(`📦 Installing dependencies for ${service}...`);
        const taskosaur = spawn('node', ['taskosaur.js', `${service}:npm`, 'install'], { 
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        
        taskosaur.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Dependencies installed for ${service}`);
                resolve();
            } else {
                reject(new Error(`taskosaur ${service}:npm install failed with code ${code}`));
            }
        });
    });
}

/**
 * Run npm build using taskosaur commands
 */
async function runTaskosaurNpmBuild(service) {
    return new Promise((resolve, reject) => {
        console.log(`🔨 Building ${service}...`);
        const taskosaur = spawn('node', ['taskosaur.js', `${service}:npm`, 'run', 'build'], { 
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        
        taskosaur.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Build completed for ${service}`);
                resolve();
            } else {
                reject(new Error(`taskosaur ${service}:npm run build failed with code ${code}`));
            }
        });
    });
}

/**
 * Install dependencies for both frontend and backend
 */
async function installDependencies() {
    try {
        await runTaskosaurNpmInstall('be');
        await runTaskosaurNpmInstall('fe');
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
        await runTaskosaurNpmBuild('be');
        await runTaskosaurNpmBuild('fe');
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
        const taskosaur = spawn('node', ['taskosaur.js', 'be:npm', 'run', 'prisma:migrate:dev'], { 
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        
        taskosaur.on('close', (code) => {
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
        const taskosaur = spawn('node', ['taskosaur.js', 'be:npm', 'run', 'seed:core', 'seed'], { 
            cwd: process.cwd(),
            stdio: 'inherit'
        });
        
        taskosaur.on('close', (code) => {
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
    runTaskosaurNpmInstall,
    runTaskosaurNpmBuild,
    installDependencies,
    buildProjects,
    runMigrations,
    runSeed,
    setupDatabase
};