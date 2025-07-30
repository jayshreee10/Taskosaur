require('dotenv').config();

const Fastify = require('fastify');
const proxy = require('@fastify/http-proxy');
const path = require('path');

const {
    APP_HOST = '127.0.0.1',
    APP_PORT = '9100',
    APP_BE_HOST = '127.0.0.1',
    APP_BE_PORT = '9101',
    APP_FE_HOST = '127.0.0.1',
    APP_FE_PORT = '9102',
    FE_UNIX_SOCKET = '0',
    BE_UNIX_SOCKET = '0',
    FE_SOCKET_PATH = path.join(__dirname, 'frontend', 'tmp', 'taskosaur-frontend.sock'),
    BE_SOCKET_PATH = path.join(__dirname, 'backend', 'tmp', 'taskosaur-backend.sock'),
} = process.env;

const fastify = Fastify({ logger: true, trustProxy: true });

const BE_UPSTREAM = BE_UNIX_SOCKET === '1' ? `unix+http://${encodeURIComponent(BE_SOCKET_PATH)}` : `http://${APP_BE_HOST}:${APP_BE_PORT}`;
const FE_UPSTREAM = FE_UNIX_SOCKET === '1' ? `unix+http://${encodeURIComponent(FE_SOCKET_PATH)}` : `http://${APP_FE_HOST}:${APP_FE_PORT}`;

// Proxy /api requests to backend
fastify.register(proxy, {
    upstream: BE_UPSTREAM,
    prefix: '/api',
    rewritePrefix: '/api',
    http2: false,
});

// Proxy all other requests to frontend
fastify.register(proxy, {
    upstream: FE_UPSTREAM,
    prefix: '/',
    rewritePrefix: '/',
    http2: false,
    preHandler: (request, reply, done) => {

        if (request.raw.url.startsWith('/api')) {
            // Don't proxy /api requests to frontend
            done(new Error('skip'));
        } else {
            done();
        }
    },
    errorHandler: (err, req, res) => {
        if (err.message === 'skip') {
            // Pass on to other routes/plugins
            return res;
        }
        res.statusCode = 500;
        res.end('frontend proxy error');
    },
});

// Start the proxy server using env vars
fastify.listen({ host: APP_HOST, port: Number(APP_PORT) }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    fastify.log.info(`Reverse proxy listening on ${address}`);
});