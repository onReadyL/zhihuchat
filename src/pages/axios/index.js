import { request } from "../utils/request";
import { userInfoUrl, userRegisterUrl, userLoginUrl } from './config';

/** 获取用户详情 */
export const getUserInfo = ({ token }) => {
    return request(userInfoUrl, {
        method: 'GET',
    });
};

/** 注册用户 */
export const register = (params) => {
    return request(userRegisterUrl, {
        method: 'POST',
        data: params
    });
}

/** 用户登录 */
export const login = (data) => {
    return request(userLoginUrl, {
        method: 'POST',
        data
    });
}