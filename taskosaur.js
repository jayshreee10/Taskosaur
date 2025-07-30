#!/usr/bin/env node

const { cli } = require('./taskosaur/cli');

// Run the CLI
cli().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});