import { notification } from 'antd';
import { extend } from 'umi-request';

const errorHandler = (error) => {
    return error;
}

const request = extend({ timeout: 15000, errorHandler });
request.interceptors.request.use(async (url, options) => {
    const headers = {
        "X-Requested-With": "XMLHttpRequest",
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    return {
        url,
        options: {  ...options, headers, requestType: 'form', parseResponse: false },
    };
});

const codeMap = {
    '-1': '服务器内部错误',
    '300': '禁止JSP功能',
    '403': '禁止访问',
    '404': '接口不存在',
    '405': '接口请求方式错误',
    '600': '缺少参数',
    '601': '参数格式错误',
    // '700': '暂无数据'
    '800': '接口无响应',
    '900': '并发异常，请重试',
    '1000': '您未获得该接口权限',
}

request.interceptors.response.use(async response => {
    //3000:当前功能仅针对专业版或者增值版开放 4000:当前功能已被限制使用 5000:当前插件未购买或者已过期
    const res = await response.json();
    const { code } = res;
    if (codeMap[code]) {
        notification.warn({
            message: '接口错误',
            description: codeMap[code],
        });
        return;
    }
    return res;
})

export { request }