module.exports = {
    apps: [
        {
            name: "mcp-server",
            script: "dist/index.js",
            cwd: __dirname,
            autorestart: true,
        },
        {
            name: "mcp-tunnel",
            script: "ngrok",
            args: "http --domain=try-relish-trimester.ngrok-free.dev 127.0.0.1:3000",
            interpreter: "none",
            autorestart: true,
        },
    ],
};