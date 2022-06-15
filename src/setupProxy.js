const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/user/roles/list',
        createProxyMiddleware({
            target: 'https://user.api.it120.cc/',
            changeOrigin: true,
            pathRewrite: {'^': ''}
        }),
    );
}