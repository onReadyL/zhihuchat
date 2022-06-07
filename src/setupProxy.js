const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/tools/MeasureApi.ashx',
        createProxyMiddleware({
            target: 'http://api1.ydaili.cn/',
            changeOrigin: true,
            pathRewrite: {'^': ''}
        }),
    );
}