import { notification } from 'antd';

import { dafault_count } from '../../constants';
import { store, child_process, chromeRemoteInterface, waitFor, Version, puppeteer } from '../../common';

/** 登录账号 */
export const login = async ({ account, id }) => {
    const { chromePath } = store.get('tools_setting_config', {});
    if (!chromePath) {
        return notification.warn({
            message: '配置错误',
            description: '未配置chrome地址'
        })
    };

    child_process.exec(`"${chromePath}" www.zhihu.com --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768`, () => {
        
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
 
    child_process.exec(`"${chromePath}" www.zhihu.com --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768 --no-sandbox`, { killSignal: 'SIGTERM', signal, }, (err, stdout, stderr) => {
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

/** 开始 */
export const begin = async (values, settingConfig, url, field) => {

    const { account, agent = false, id } = values;
    const { chromePath, count, chat_interval, random, texts } = settingConfig;
    // 私信条数
    const tempCount = count || dafault_count;

    let childProcess;

    // if (agent) {
    //     childProcess = child_process.exec(`"${chromePath}" ${url} --remote-debugging-port=9222 --profile-directory=${account} --app-shell-host-window-size=1024x768 --proxy-server=${''}`, (error, stdout, stderr) => {
                
    //     }); 
    // } else {
        childProcess = child_process.exec(`"${chromePath}" ${url} --remote-debugging-port=9222 --profile-directory=${account} --app-shell-host-window-size=800x768`, (error, stdout, stderr) => {
                
        });
    // };

    let client;
    let Page;
    let Network;

    try {
        client = await chromeRemoteInterface();

        Page = client.Page;
        Network = client.Network;
        await Network.enable();
        await Page.enable();
        const isLogined = await Network.getCookies({ urls: ['https://zhuanlan.zhihu.com/'] }).then(res => { 
            return res.cookies.filter(item => item.name === 'z_c0').length;
        });

        if (!isLogined) {
            notification.warn({
                message: '请登录',
                description: '登录后关闭浏览器重新开始（请勿登录其他账号）'
            });
            throw new Error('未登录');
        }

        await Version({}).then(async (info) => {
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
                await zhuanlanChat({ browser, page: page1, count: tempCount, interval: chat_interval, id, texts, random  });
            } else if (field === 'user_url') {
                await followersChat({ browser, page: page1, count: tempCount, interval: chat_interval, id, texts, random  })
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
                 return (res[res.length - 1]).hover();
             });
             await waitFor(1000);
             postCount = await voterContent.$$('.List-item').then(res => res.length);
         } while (
             postCount > preCount
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
            description: '当前账号无关注着'
        });
        throw new Error('无关注着');
    }

    await page.evaluate((element) => {
        element.click()
    }, followersA);
    await waitFor(2000); //  等待渲染
    const profileFollowingWrapper = await page.waitForSelector('.ListShortcut > .List > div:last-child', { timeout: 3000 });
    let followersListItem = await profileFollowingWrapper.$$('.List-item');

    let pageIndex = 19;
    for (let i = 0; i < count; i++) {
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