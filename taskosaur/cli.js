const setup = require('./commands/setup');
const run = require('./commands/run');
const help = require('./commands/help');
const beNpm = require('./commands/be-npm');
const feNpm = require('./commands/fe-npm');

/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const command = args[2] || 'help';
    const options = {
        dev: args.includes('--dev')
    };
    
    // For be:npm and fe:npm commands, we need to pass all remaining args
    const remainingArgs = args.slice(2);
    
    return { command, options, remainingArgs };
}

/**
 * Main CLI handler
 */
async function cli() {
    const { command, options, remainingArgs } = parseArgs(process.argv);
    
    switch (command) {
        case 'setup':
            await setup(options);
            break;
            
        case 'run':
            await run(options);
            break;
            
        case 'be:npm':
            await beNpm(remainingArgs);
            break;
            
        case 'fe:npm':
            await feNpm(remainingArgs);
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