const { installDependencies, setupDatabase } = require('../modules/npm');
const { getConfig } = require('../modules/config');
const { createEnvFiles } = require('../modules/env');

/**
 * Setup command - Install dependencies and build projects
 */
async function setup(options = {}) {
    try {
        console.log('🔧 Setting up Taskosaur...\n');
        
        const config = getConfig();
        const isDev = options.dev || false;
        
        // Install dependencies
        await installDependencies();
        
        // Create environment files
        await createEnvFiles();
        
        // Setup database (migrations and seed)
        console.log('\n🗃️  Setting up database...');
        await setupDatabase();
        
        console.log('\n✅ Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('  • Run "node taskosaur.js run" to start all services');
        console.log('  • Run "node taskosaur.js run --dev" for development mode');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

module.exports = setup;