const url = require('url');
const https = require('https');
const fs = require('fs');
let proxyMiddleware = require('http-proxy-middleware');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = process.env.NODE_ENV || 'local';

let target = process.env.DM_STORE_URL || 'https://dm-store-aat.service.core-compute-aat.internal';

let sshProxy;
function attachSSHProxy(proxy) {
    if(process.env.NODE_ENV === 'local') {
        let agent;
        if(!sshProxy) {
            const SocksProxyAgent = require('socks-proxy-agent');
            const proxyUrl = 'socks://127.0.0.1:9090';
            agent = new SocksProxyAgent(proxyUrl, true);
        }
        proxy.agent = agent;
    }
    return proxy;
}

module.exports = app => {

    const proxyConfig = attachSSHProxy({
        target: target,
        logLevel: 'debug',
        secure: false,
        rejectUnauthorized: false,
        changeOrigin: true,
        pathRewrite: {
            '/demproxy/dm/': '/'
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(proxyRes.statusCode);
            // console.log(req.url);
        }
    });

    app.get('/demproxy/dm/*', proxyMiddleware(proxyConfig));

};


