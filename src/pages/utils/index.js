import { notification } from 'antd';
import iconv from 'iconv-lite';

import { store, child_process, chromeRemoteInterface, waitFor, Version, puppeteer } from '../../common';
import { chat_max_count } from '../../constants';

const startChromeProcess = ({ chromePath, url, port = 9222, account, proxy, resParams = [] }, options = {}, callback = () => {}) => {
    let tempChildProcess;
    if (proxy) {
        tempChildProcess = child_process.exec(`"${chromePath}" ${url} --remote-debugging-port=${port} --profile-directory=${account} --window-size=888,768 --proxy-server=${proxy} ${resParams.join(' ')}`, options, callback); 
    } else {
        tempChildProcess = child_process.exec(`"${chromePath}" ${url} --remote-debugging-port=${port} --profile-directory=${account} --window-size=888,768 ${resParams.join(' ')}`, options, callback);
    }
    if (tempChildProcess) {
        tempChildProcess.on('error', () => {
            notification.error({
                message: '系统错误',
                description: '启动浏览器出错'
            })   
        })
    }
    return tempChildProcess;
}

/** 登录账号 */
export const login = async ({ account, id }) => {
    const { chromePath } = store.get('tools_setting_config', {});
    if (!chromePath) {
        return notification.warn({
            message: '配置错误',
            description: '未配置chrome地址'
        })
    };
    
    startChromeProcess({ chromePath, url: 'www.zhihu.com', account });

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
    const { chromePath } = store.get('tools_setting_config', {});
    const dataSource = store.get('tools_dataSource', []);
    if (!chromePath) {
        return notification.warn({
            message: '配置错误',
            description: '未配置chrome地址'
        });
    };

    const controller = new AbortController();
    const signal = controller.signal;

    const callback = (err, stdout, stderr) => {
        if (err) {
            notification.warn({
                message: '系统错误',
                description: '请联系管理员'
            });
            return
       }
    }
    
    startChromeProcess({ chromePath, url: 'www.zhihu.com', account, resParams: ['--no-sandbox'] }, { killSignal: 'SIGTERM', signal, }, callback);

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

/** 开始 */
export const begin = async (values, settingConfig, url, field, activeIndex, agentType, vpsConfig, vpsTest) => {
    const dataSource = store.get('tools_dataSource', []);
    const { account, agent = false, id } = values;
    const { chromePath, count, chat_interval, random, texts } = settingConfig;
    const { vpsName, vpsAccount, vpsPassword  } = vpsConfig;

    let childProcess;

    if (agent) {
        if (agentType === 'vps') {
            if (!vpsName) {
                notification.warn({
                    message: '操作错误',
                    description: '未配置wps',
                })
                throw new Error('未配置vps');
            }
            if (!vpsTest) {
                notification.warn({
                    message: '操作错误',
                    description: 'vps拨号未测试或测试不通过',
                })
                throw new Error('vps拨号未测试或测试不通过');
            }
            if (activeIndex !== 0) {
                // 第二个账号开始重新拨号
                const rasdialDisconnectPromise = new Promise((res, rej) => {
                    child_process.exec(`Rasdial ${vpsName} /disconnect`, { encoding: 'binary' }, (err, stdout, stderr) => {
                        if (stdout) {
                            res(iconv.decode(new Buffer(stdout, 'binary'), 'cp936'));
                        } else if (err || stderr) {
                            rej(err || stderr);
                        }
                    })
                });
                await rasdialDisconnectPromise;
                const rasdialConnectPromise = new Promise((res, rej) => {
                    child_process.exec(`Rasdial ${vpsName} ${vpsAccount} ${vpsPassword}`, { encoding: 'binary' }, (err, stdout, stderr) => {
                        if (stdout) {
                            res(iconv.decode(new Buffer(stdout, 'binary'), 'cp936'));
                        } else if (err || stderr) {
                            rej(err || stderr);
                        }
                    })
                });
            
                const reConnenctStatusStr = await rasdialConnectPromise.then(res => res).catch(err => false);
                const reConnenctStatusArr = reConnenctStatusStr.split(/[\s\n]/).filter(item => !!item);
                if (!reConnenctStatusStr) return false;

                if (reConnenctStatusArr.includes('远程访问错误')) {
                    notification.warn({
                        message: '拨号错误',
                        description: '远程访问错误'
                    });
                    throw new Error('远程访问错误')
                }
                await waitFor(1000);
                childProcess = startChromeProcess({ chromePath, url, port: 9222, account, });
            }
            
        } else if (agentType === 'ip') {
            childProcess = startChromeProcess({ chromePath, url, port: 9222, account, proxy: '' }); 
        }
    } else {
        childProcess = startChromeProcess({ chromePath, url, port: 9223, account, });
    };
    let client;
    let Page;
    let Network;

    try {
        client = await chromeRemoteInterface({ port: '9223' });

        Page = client.Page;
        Network = client.Network;
        await Network.enable();
        await Page.enable();
        const isLogined = await Network.getCookies({ urls: ['https://zhuanlan.zhihu.com/'] }).then(res => { 
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
            store.set('tools_dataSource', temDataSource);
            notification.warn({
                message: '请登录',
                description: '登录后关闭浏览器重新开始（请勿登录其他账号）'
            });
            throw new Error('未登录');
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

        await Version({ port: 9223 }).then(async (info) => {
            const { webSocketDebuggerUrl } = info || {};

            const browser = await puppeteer.connect({
                browserWSEndpoint: webSocketDebuggerUrl,
                defaultViewport: {
                    width: 1024,
                    height: 768
                },
            });

            await browser.on('targetcreated', async (target) => {
                let targetPage = await target.page();
                if (targetPage) {
                    await targetPage.on('close', () => {
                        targetPage = null;
                    });

                    await targetPage.on('response', async (res) => {
                        const { _url, _status } = res;
                        if (_url.indexOf('/api/v4/commercial/ecommerce') !== -1 && _status === 403) {
                            const { error } = await res.json();
                            const { code } = error || {};
                            if (code === 4039) {
                                const dataSource = store.get('tools_dataSource', []);
                                const tempDataSource = dataSource.map(item => {
                                    if (item.id === id) {
                                        return {
                                            ...item,
                                            status: code
                                        }
                                    } else {
                                        return item;
                                    }
                                });
                                store.set('tools_dataSource', tempDataSource);
                                notification.warn({
                                    message: '账号问题',
                                    description: '此账号身份验证存在问题'
                                });
                                await waitFor(1000);
                                targetPage && await targetPage.close();
                                throw new Error('账号异常');
                            }
                        }
                    });
                }
            });

            const [page1] = await browser.pages();

            await page1.content();

            // TODO: 等待页面加载完
            await waitFor(1000);
            if (field === 'article_url') {
                await zhuanlanChat({ browser, page: page1, count, interval: chat_interval, id, texts, random  });
            } else if (field === 'user_url') {
                await followersChat({ browser, page: page1, count, interval: chat_interval, id, texts, random  })
            }

        }).catch((err) => {
            throw new Error(err);
        })

        
    } catch (error) {
        if (Page) {
            Page.close();
        }
        throw new Error(error);
    }



}

/** 专栏私信 */
const zhuanlanChat = async ({ browser, page, count, interval, id, texts, random }) => {
     /** 功能代码 */
     const isVoters = await page.waitForSelector(".Voters", { timeout: 10000 }).then(res => {
        return !!res;
    }).catch(err => {
        return false;
    });

    if (!isVoters) {
        notification.warn({
            message: '操作错误',
            description: '当前文章无人点赞'
        });
        await browser.close();
        throw new Error('当前文章无人点赞');
    }

    await page.waitForSelector('.Voters > button', { timeout: 10000 }).then(res => res.click({ delay: 500 })).catch(err => {
        console.log(err);
    });

    const isListItems = await page.waitForSelector('.VoterList > .VoterList-content .List-item', { timeout: 10000 }).catch(res => { return false });
    
    if (!isListItems) {
        notification.warn({
            message: '系统错误',
            description: '请联系管理员'
        });
        await browser.close();
        throw new Error('系统错误');
    }

    const voterContent = await page.waitForSelector('.VoterList > .VoterList-content', { timeout: 3000 });

    // 滚动加载
    await waitFor(1000);
    let preCount = 0;
    let postCount = 0;
    try {
         do {
             preCount = await voterContent.$$('.List-item').then(res => res.length);
             await voterContent.$$('.List-item').then(res => {
                (res[res.length - 1]).hover();
             });
             await waitFor(1000);
             postCount = await voterContent.$$('.List-item').then(res => res.length);
         } while (
             postCount > preCount && count > postCount
         );
     } catch (error) {
         throw new Error(error);
    }
    
    try {
        // 回到顶部
        await voterContent.$$('.List-item').then(res => {
            return (res[0]).hover();
        });
        
    } catch (error) {
        throw new Error(error)
    }

    const total = postCount < count ? postCount : count;

    const voterList = await voterContent.$$('.List-item');

    /** 循环点击赞同列表并发私信 */
    try {
        for (let i = 0; i < total; i++) {
            i !== 0 && await waitFor(interval * 1000); // 间隔时间
            await voterList[i].$('.ContentItem .ContentItem-main .ContentItem-head .UserLink').then(res => res.click()); // 打开新页面，brower.on('targetcreated')监听到
            
            await page.mouse.move(0, 0); // 移动鼠标
            // const userName = await voterList[i].$eval('.ContentItem .ContentItem-main .ContentItem-head .UserLink a', node => node.innerText);
            
            await waitFor(2000); // 优化

            const pages = await browser.pages(); // 耗时长
            if (pages.length < 2) {
                continue;
            }
            const newPage = pages[1];

            newPage.on('response', async (res) => {
                const { _url, _status } = res;
                // 埋点
                if (_url.indexOf('/api/v4/chat') !== -1 && _url.indexOf('sender_id') === -1) {
                    const { error } = await res.json();
                    const { code } = error || {};
                    if (_status === 403) {
                        if (code === 40386) {
                            // 未回复
                        }
                        if (code === 4039) {
                            // 账号异常
                            const dataSource = store.get('tools_dataSource', []);
                            const tempDataSource = dataSource.map(item => {
                                if (item.id === id) {
                                    return {
                                        ...item,
                                        status: code
                                    }
                                } else {
                                    return item;
                                }
                            });
                            store.set('tools_dataSource', tempDataSource);
                            notification.warn({
                                message: '账号问题',
                                description: '此账号身份验证存在问题'
                            });
                            await page.close();
                            throw new Error('账号异常');
                        }
                    }
                }
            });
            
            const isContinue = await newPage.waitForSelector('.MemberButtonGroup button:last-child', { timeout: 3000, visible: true }).then(res => res.click()).catch(err => {
                return true;
            });

            if (isContinue) {
                await waitFor(1000);
                await newPage.close();
                continue;
            }

            const textarea = await newPage.waitForSelector('.ChatBoxModal textarea', { timeout: 5000 });
            let tempTexts = texts;
            try {
                if (random) {
                    const index = Math.floor(Math.random() * tempTexts.length);
                    tempTexts = tempTexts[index];
                    await textarea.type(tempTexts || '', { delay: 1000 });
                    await waitFor(1000);
                    await newPage.$(".InputBox-sendBtn").then(res => res.click());
                } else {
                    for (let j = 0; j < texts.length; j++) {
                        await textarea.type(texts[j] || '', { delay: 500 });
                        await waitFor(1000);
                        await newPage.$(".InputBox-sendBtn").then(res => res.click());
                    }
                }
                await waitFor(1000);
                await newPage.close();
            } catch (error) {
                throw new Error(error);
            }
        }
        await waitFor(2000);
        await browser.close();
    } catch (error) {
        throw new Error(error)
    }
}

/** 关注者私信 */
const followersChat = async ({ browser, page, count, interval, id, texts, random }) => {
    const followersA = await page.waitForSelector('.FollowshipCard-counts > a:last-child', { timeout: 3000 });
    const followersCount = await followersA.$eval('.NumberBoard-itemValue', res => res.innerText );
    if (followersCount === '0') {
        notification.info({
            message: '操作错误',
            description: '当前账号无关注者'
        });
        throw new Error('无关注着');
    }

    await page.evaluate((element) => {
        element.click()
    }, followersA);
    await waitFor(2000); //  等待渲染
    const profileFollowingWrapper = await page.waitForSelector('.ListShortcut > .List > div:last-child', { timeout: 3000 });
    let total = 0;
    let followersListItem = await profileFollowingWrapper.$$('.List-item');

    let pageIndex = 0;
    for (let i = 0; i < count; i++) {
        const nowPageCount = await profileFollowingWrapper.$$('.List-item').then(res => res.length);
        total = total + nowPageCount;
        if ( i >= total) {
            break;
        }
        i !== 0 && await waitFor(interval * 1000); // 间隔时间
        await followersListItem[pageIndex].$('.ContentItem .ContentItem-main .ContentItem-head .UserLink').then(res => res.click()); // 打开新页面
        await page.mouse.move(0, 0);
        await waitFor(2000); // 优化
        const pages = await browser.pages(); // 耗时长
        if (pages.length < 2) {
            continue;
        }
        const newPage = pages[1];
        newPage.on('response', async (res) => {
            const { _url, _status } = res;
            // 埋点
            if (_url.indexOf('/api/v4/chat') !== -1 && _url.indexOf('sender_id') === -1) {
                const { error } = await res.json();
                const { code } = error || {};
                if (_status === 403) {
                    if (code === 40386) {
                        // 未回复
                    }
                    if (code === 4039) {
                        // 账号异常
                        const dataSource = store.get('tools_dataSource', []);
                        const tempDataSource = dataSource.map(item => {
                            if (item.id === id) {
                                return {
                                    ...item,
                                    status: code
                                }
                            } else {
                                return item;
                            }
                        });
                        store.set('tools_dataSource', tempDataSource);
                        notification.warn({
                            message: '账号问题',
                            description: '此账号身份验证存在问题'
                        });
                        throw new Error('账号异常');
                    }
                }
            }
        });
        const isContinue = await newPage.waitForSelector('.MemberButtonGroup button:last-child', { timeout: 3000, visible: true }).then(res => res.click()).catch(err => {
            return true;
        });

        if (isContinue) {
            await waitFor(1000);
            await newPage.close();
            continue;
        }
        const textarea = await newPage.waitForSelector('.ChatBoxModal textarea', { timeout: 5000 });
        let tempTexts = texts;
        try {
            if (random) {
                const index = Math.floor(Math.random() * tempTexts.length);
                tempTexts = tempTexts[index];
                await textarea.type(tempTexts || '', { delay: 1000 });
                await waitFor(1000);
                await newPage.$(".InputBox-sendBtn").then(res => res.click());
            } else {
                for (let j = 0; j < texts.length; j++) {
                    await textarea.type(texts[j] || '', { delay: 500 });
                    await waitFor(1000);
                    await newPage.$(".InputBox-sendBtn").then(res => res.click());
                }
            }
            await waitFor(1000);
            await newPage.close();
        } catch (error) {
            throw new Error(error);
        }
        pageIndex++;
        if (pageIndex === 20) {
            const isNext = await page.waitForSelector('.PaginationButton-next', { timeout: 3000 }).catch(res => { return false });
            if (!isNext) {
                break;
            }
            const [response] = await Promise.all([
                page.waitForNavigation({
                    waitUntil: 'networkidle2'
                }),
                isNext.click(),
            ]);
            await waitFor(2000);
            followersListItem = await page.$$('.ListShortcut > .List > div:last-child .List-item', { timeout: 3000 });;
            pageIndex = 0;
        }
    }

}

/** 测试vps */
export const testVps = async ({ vpsName, vpsAccount, vpsPassword }) => {

    const childProcessRasdialPromise = new Promise((res, rej) => {
        child_process.exec('Rasdial', { encoding: 'binary' }, (err, stdout, stderr) => {
            if (stdout) {
                res(iconv.decode(new Buffer(stdout, 'binary'), 'cp936'));
            } else if (err || stderr) {
                rej(err || stderr);
            }
        })
    });

    const initialStatusStr = await childProcessRasdialPromise.then(res => {
        return res;
    }).catch(err => {
        return;
    });

    if (!initialStatusStr) {
        return false
    }
    const statusArr = initialStatusStr.split(/[\s\n]/).filter(item => !!item) // 以换行和空格切割
    // 已连接
    const isConnection = statusArr.includes('已连接');
    const isDissConnection = statusArr.includes('没有连接');
    const isConnectionError = statusArr.includes('远程访问错误');

    if (isConnection) {
        // 已连接
        const connenctName = statusArr[1];
        const childProcessRasdialDisconnectPromise = new Promise((res, rej) => {
            child_process.exec(`Rasdial ${connenctName} /disconnect`, { encoding: 'binary' }, (err, stdout, stderr) => {
                if (stdout) {
                    res(iconv.decode(new Buffer(stdout, 'binary'), 'cp936'));
                } else if (err || stderr) {
                    rej(err || stderr);
                }
            })
        });
        await childProcessRasdialDisconnectPromise;
    }

    const childProcessRasdialConnectPromise = new Promise((res, rej) => {
        child_process.exec(`Rasdial ${vpsName} ${vpsAccount} ${vpsPassword}`, { encoding: 'binary' }, (err, stdout, stderr) => {
            if (stdout) {
                res(iconv.decode(new Buffer(stdout, 'binary'), 'cp936'));
            } else if (err || stderr) {
                rej(err || stderr);
            }
        })
    });

    const reConnenctStatusStr = await childProcessRasdialConnectPromise.then(res => res).catch(err => false);

    const reConnenctStatusArr = reConnenctStatusStr.split(/[\s\n]/).filter(item => !!item);
    if (!reConnenctStatusStr) return false;

    if (reConnenctStatusArr.includes('远程访问错误')) {
        return false
    } else if (reConnenctStatusArr.includes('已连接')) {
        return true;
    }


    // 远程访问错误 623 系统无法为这个连接找到电话簿项目
    // 远程访问错误 691 已拒绝远程连接，因为未识别出您提供的用户名和密码组合，或在远程访问服务器上禁止使用选定的身份验证协议
    // 远程访问错误 756 已经拨了这个连接
    // 远程访问错误 651 调制解调器(或其他连接设备)报告了一个错误
    // 已连接

}

/** 检查版本降低时，配置是否合法 */
export const verifyVersion = ({ count }) => {
    if (count > chat_max_count) {
        notification.warn({
            message: '操作错误',
            description: '版本降低，请更新配置'
        });
        return false
    }
    return true;
}