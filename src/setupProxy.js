const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    // // 直连ip
    // app.use(
    //     '/getip',
    //     createProxyMiddleware({
    //         target: 'http://webapi.http.zhimacangku.com/',
    //         changeOrigin: true,
    //         pathRewrite: {'^': ''}
    //     })
    // );
    // // 独享&&隧道ip
    // app.use(
    //     '/getip3',
    //     createProxyMiddleware({
    //         target: 'http://http.tiqu.letecs.com/',
    //         changeOrigin: true,
    //         pathRewrite: {'^': ''}
    //     })
    // );
    // // 余额
    // app.use(
    //     '/index/index/get_my_balance',
    //     createProxyMiddleware({
    //         target: 'https://wapi.http.linkudp.com/',
    //         changeOrigin: true,
    //         pathRewrite: { '^': '' }
    //     })
    // );
    // // 添加白名单
    // app.use(
    //     '/index/index/save_white',
    //     createProxyMiddleware({
    //         target: 'https://wapi.http.linkudp.com/',
    //         changeOrigin: true,
    //         pathRewrite: { '^': '' }
    //     })
    // );
    // // 添加白名单
    // app.use(
    //     '/index/index/del_white',
    //     createProxyMiddleware({
    //         target: 'https://wapi.http.linkudp.com/',
    //         changeOrigin: true,
    //         pathRewrite: { '^': '' }
    //     })
    // )
}