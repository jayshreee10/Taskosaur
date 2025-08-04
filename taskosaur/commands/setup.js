const { createSimpleEnvFile } = require('../modules/env');

/**
 * Setup command - Create .env file only
 */
async function setup(options = {}) {
    try {
        console.log('🔧 Setting up Taskosaur environment...\n');
        
        // Create environment file
        await createSimpleEnvFile();
        
        console.log('\n✅ Environment setup completed successfully!');
        console.log('\nNext steps:');
        console.log('  • Install dependencies: npm run be:install && npm run fe:install');
        console.log('  • Run database migrations: npm run db:migrate');
        console.log('  • Seed the database: npm run db:seed');
        console.log('  • Run "node taskosaur.js run" to start all services');
        console.log('  • Run "node taskosaur.js run --dev" for development mode');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

module.exports = setup;