const host = 'https://api.it120.cc/onReadyL'; // 用户端接口

/** 用户模块 start */
const user = host + '/user';

/** 查看用户详情url */
export const userInfoUrl = user + '/detail';

/** 用户注册url */
export const userRegisterUrl = user + '/username/register';

/** 用户登录url */
export const userLoginUrl = user + '/username/login';

/** 用户模块 end */

/** 支付 start */
const pay = host + '/pay';

/** 支付宝收款二维码 */
export const alipayQrcode = pay + '/alipay/gate/qrcode';
/** 支付 end */