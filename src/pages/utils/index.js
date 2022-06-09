import { notification } from 'antd';
import { nanoid } from 'nanoid';

import { store, child_process, chromeRemoteInterface, waitFor } from '../../common';

/** 登录账号 */
export const login = async ({ account, id }) => {
    const { path } = store.get('tools_config', {});
    if (!path) {
        return notification.warn({
            message: '配置错误',
            description: '未配置chrome地址'
        })
    };

    child_process.exec(`"${path}" www.zhihu.com --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768`, () => {
        
    })

    let client;
    let Page;
    let Network;
    try {
        client = await chromeRemoteInterface();
        Page = client.Page;
        Network = client.Network;
        await Network.enable();
        await Page.enable();
    } catch (error) {
        if (Page) {
            Page.close();
        }
    }
};

/** 测试账号 */
export const testAccount = async ({ account, id }) => {
    const { path } = store.get('tools_config', {});
    const dataSource = store.get('tools_dataSource', []);
    if (!path) {
        return notification.warn({
            message: '配置错误',
            description: '未配置chrome地址'
        });
    };

    const controller = new AbortController();
    const signal = controller.signal;
 
    child_process.exec(`"${path}" www.zhihu.com --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768 --no-sandbox`, { killSignal: 'SIGTERM', signal, }, (err, stdout, stderr) => {
        if (err) {
            notification.warn({
                message: '系统错误',
                description: '请联系管理员'
            });
            return
       }
    });

    let client;
    let Page;
    let Network;
    try {
        client = await chromeRemoteInterface().catch(err => {
            notification.warn({
                message: '系统错误',
                description: '请联系管理员'
            });
            return
        });
        Page = client.Page;
        Network = client.Network;
        await Network.enable();
        await Page.enable();

        const isLogined = await Network.getCookies({ urls: ['https://www.zhihu.com'] }).then(res => {
            return res.cookies.filter(item => item.name === 'z_c0').length;
        });

        if (!isLogined) {
            const temDataSource = dataSource.map((item) => {
                if (item.id === id) {
                    return { ...item, status: 2 }
                } else {
                    return item
                }
            });
            store.set('tools_dataSource', temDataSource)
        } else {
            const temDataSource = dataSource.map((item) => {
                if (item.id === id) {
                    return { ...item, status: 10 }
                } else {
                    return item
                }
            });
            store.set('tools_dataSource', temDataSource)
        };
    } catch (error) {
        if (Page) {
            Page.close();
        }
    }

    if (Page) {
        await Page.close();
    }

    controller.abort()
}