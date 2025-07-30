const setup = require('./commands/setup');
const run = require('./commands/run');
const help = require('./commands/help');

/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const command = args[2] || 'help';
    const options = {
        dev: args.includes('--dev')
    };
    
    return { command, options };
}

/**
 * Main CLI handler
 */
async function cli() {
    const { command, options } = parseArgs(process.argv);
    
    switch (command) {
        case 'setup':
            await setup(options);
            break;
            
        case 'run':
            await run(options);
            break;
            
        case 'help':
        case '--help':
        case '-h':
            help();
            break;
            
        default:
            console.error(`❌ Unknown command: ${command}`);
            console.log('Run "node taskosaur.js help" for usage information.');
            process.exit(1);
    }
}

module.exports = { cli, parseArgs };