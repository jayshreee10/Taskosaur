/**
 * Help command - Display usage information
 */
function help() {
    console.log(`
🦕 Taskosaur - Project Management Tool

USAGE:
  node taskosaur.js <command> [options]

COMMANDS:
  setup     Install dependencies and build projects
  run       Start all Taskosaur services (backend, frontend, proxy)
  help      Show this help message

OPTIONS:
  --dev     Run in development mode (skips build step)

EXAMPLES:
  node taskosaur.js setup          # Install deps and build projects
  node taskosaur.js setup --dev    # Install deps only (skip build)
  node taskosaur.js run            # Start all services in production mode
  node taskosaur.js run --dev      # Start all services in development mode
  node taskosaur.js help           # Show this help

CONFIGURATION:
  Environment variables starting with GLOBAL_ will be processed and made 
  available without the prefix. For example:
    GLOBAL_APP_HOST=127.0.0.1 becomes APP_HOST=127.0.0.1

SERVICES:
  • Backend: NestJS API server
  • Frontend: Next.js web application  
  • Proxy: Fastify reverse proxy

For more information, visit: https://github.com/your-org/taskosaur
`);
}

module.exports = help;