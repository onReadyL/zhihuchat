import React, { useEffect, useState } from "react";
import { Form, Input, Button, Table, message, Modal, Checkbox, Select, Space, notification } from 'antd';
import { nanoid } from 'nanoid';
import moment from "moment";

import { dafault_count } from '../../constants/index';
import { puppeteer, child_process, chromeRemoteInterface, Version, waitFor, store } from '../../common';
import { login, testAccount } from '../utils/index';

import './index.css';

const Index = ({ ip }) => {

    const [visible, setVisible] = useState(false);

    const [dataSource, setDataSource] = useState(store.get('tools_dataSource', [])); // 账号数据
    
    store.onDidChange('tools_dataSource', (newValue, oldValue) => {
        setDataSource(newValue || []);
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState(store.get('tools_dataSource_selected', []).map(item => item.id)); // 选中

    const [pageNo, setPageNo] = useState(1);

    const [form] = Form.useForm();

    const [dataIndex, setDataIndex] = useState();

    const [isEdit, setIsEdit] = useState({
        index: 0,
        bool: false
    });

    const next = () => {
        const nextIndex = dataIndex + 1;
        if (nextIndex > dataSource.length) {
            setDataIndex();
        } else {
            setDataIndex(nextIndex)
        }
    }

    // 是否有正在运行的账号
    const isLoading = dataSource.some(item => item.loading);

    const begin = async () => {
        if (!dataIndex) {
            return
        }
        const { account, password, agent = false, group, chat_interval } = dataSource[dataIndex - 1];

        /** 配置 */
        const { path, url, count, text } = store.get('tools_config', {});

        if (!path) {
            setDataIndex();
            notification.warn({
                message: '配置错误',
                description: '未配置chrome地址'
            });
            return;
        };
        if (!text) {
            setDataIndex();
            notification.warn({
                message: '配置错误',
                description: '未配置私信文本'
            });
            return;
        }

        let childProcess;

        /** 启动本地chrome 并进入知乎 */
        if (agent) {
            childProcess = child_process.exec(`"${path}" ${url} --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768 --proxy-server=${ip}`, (error, stdout, stderr) => {
                
            }); 
        } else {
            childProcess = child_process.exec(`"${path}" ${url} --remote-debugging-port=9222 --profile-directory=${account} --ash-host-window-bounds=1024x768`, (error, stdout, stderr) => {
                
            });
        }

        async function conecctChrome() {
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
                    setDataIndex();
                    notification.warn({ message: '请登录', description: '登录后关闭浏览器重新开始（请勿登录其他账号）' });
                    setDataSource((prev) => {
                        return prev.map((item, index) => {
                            if (index === dataIndex - 1) {
                                return { ...item, status: 2 }
                            } else {
                                return item
                            }
                        })
                    })
                    return;
                } else {
                    setDataSource((prev) => {
                        return prev.map((item, index) => {
                            if (index === dataIndex - 1) {
                                return { ...item, status: 10 }
                            } else {
                                return item
                            }
                        })
                    })
                }

                // 获取webSocketDebuggerUrl
                await Version({}, async (err, info) => {
                    if (err) {
                        return;
                    }
                    const { webSocketDebuggerUrl } = info || {};

                    const browser = await puppeteer.connect({
                        browserWSEndpoint: webSocketDebuggerUrl,
                        defaultViewport: {
                            width: 1024,
                            height: 768
                        },
                    });

                    await browser.on("disconnected", async () => {
                       
                    })

                    await browser.on('targetcreated', async (target) => {
                        let targetPage = await target.page();
                        if (targetPage) {
                            await targetPage.on('close', async (res) => {
                                targetPage = null;
                            })
                            await targetPage.on("response", async (res) => {
                                const { _url, _status } = res;
                                // 身份异常
                                if (_url.indexOf('/api/v4/commercial/ecommerce') !== -1 && _status === 403) {
                                    message.info('账号异常');
                                    await waitFor(1000);
                                    targetPage && await targetPage.close();
                                }
                            })
                        }
                    })

                    const [page1] = await browser.pages();

                    // todo: 可能存在网络错误
                    await page1.content();
                    
                    //  notification.warn({
                    //         message: '网络错误',
                    //         description: "请检查网络状况或稍后重试"
                    //     });

                    const isVoters = await page1.waitForSelector(".Voters", { timeout: 10000 }).then(res => {
                            return !!res;
                        }).catch(err => {
                            return false;
                        })
                    
                    if (!isVoters) {
                        notification.warn({
                            message: '操作错误',
                            description: '当前文章无人点赞'
                        });
                        await browser.close();
                        setDataIndex()
                        return;
                    }

                    // TODO: 点不开，导致下一句超时
                    await page1.waitForSelector('.Voters > button', { timeout: 10000 }).then(res => res.click({ delay: 500 })).catch(err => {
                        console.log(err);
                    });

                    const isListItems = await page1.waitForSelector('.VoterList > .VoterList-content .List-item', { timeout: 10000 }).catch(res => { return false });
                    
                    if (!isListItems) {
                        notification.warn({
                            message: '系统错误',
                            description: '请联系管理员'
                        });
                        await browser.close();
                        setDataIndex()
                        return;
                    }

                    const voterContent = await page1.waitForSelector('.VoterList > .VoterList-content');
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
                        console.log(error)
                        setDataIndex();
                    }

                    try {
                        // 回到顶部
                        await voterContent.$$('.List-item').then(res => {
                            return (res[0]).hover();
                        });
                        
                    } catch (error) {
                        
                    }

                    // 私信条数
                    const tempCount = count || dafault_count;

                    const total = postCount < tempCount ? postCount : tempCount;

                    const voterList = await voterContent.$$('.List-item');
                    
                    /** 循环点击赞同列表并发私信 */
                    try {
                        for (let i = 0; i < total; i++) {
                            await waitFor(chat_interval * 1000); // 间隔时间
                            await voterList[i].$('.ContentItem .ContentItem-main .ContentItem-head .UserLink').then(res => res.click()); // 打开新页面，brower.on('targetcreated')监听到
                            
                            await page1.mouse.move(0, 0); // 移动鼠标
                            // const userName = await voterList[i].$eval('.ContentItem .ContentItem-main .ContentItem-head .UserLink a', node => node.innerText);
                            
                            await waitFor(2000); // 优化

                            const pages = await browser.pages(); // 耗时长
                            if (pages.length < 2) {
                                continue;
                            }
                            const newPage = pages[1];

                            await newPage.on('response', async (res) => {
                                const { _url, _status } = res;
                                if (_url.indexOf('/api/v4/chat') !== -1 && _url.indexOf('sender_id') === -1) {
                                    if (_status === 403) {
                                        // 拒绝 或 账号异常
                                        await waitFor(1000)
                                        newPage && await newPage.close();
                                    } else if (_status === 200) {
                                        // 成功
                                        await waitFor(1000)
                                        newPage && await newPage.close();
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
                            await textarea.type(text || '', { delay: 1000 });
                            await waitFor(1000);
                            await newPage.$(".InputBox-sendBtn").then(res => res.click());
                        }
                        await waitFor(2000);
                        await browser.close();
                        next()
                    } catch (error) {
                        console.log(error)
                        setDataIndex();
                    }
                });

            } catch (err) {
                console.log(err)
                setDataIndex();
                if (Page) {
                    Page.close()
                }
            }
        }

        await conecctChrome();
    }

    // 控制数据loading状态
    useEffect(() => {
        if (dataIndex) {
            setDataSource(prev => {
                return prev.map((item, index) => {
                    return { ...item, loading: index === dataIndex - 1}
                })
            })
            setTimeout(() => {
                begin();
            }, 0)
        } else {
            setDataSource((prev) => {
                return prev.map(item => ({...item, loading: false }))
            })
        }
     }, [dataIndex]);
   

    /** 确定添加账号 */
    const onOk = () => {
        form.validateFields().then((values) => {
            let tempValues;
            if (isEdit.bool) {
                tempValues = dataSource.map((item, index) => {
                    if (isEdit.index - 1 === index) {
                        return {...item, ...values};
                    } else {
                        return item
                    }
                })
            } else {
                const isExsit = dataSource.find(item => item.account === values.account);
                if (!!isExsit) {
                    return notification.warn({
                        message: '操作错误',
                        description: '该账号已存在'
                    })
                }
                tempValues = [...dataSource, {...values, id: nanoid(10), status: 1, createTime: moment().format('YYYY-MM-DD') }];
            }
            store.set('tools_dataSource', tempValues);
            // setDataSource(tempValues);
            form.resetFields();
            setIsEdit((prev) => ({ ...prev, bool: false }));
            setVisible(false);
        })
    }

    /** 清空账号 */
    const clearAccount = () => {
        // setDataSource([]);
        store.delete("tools_dataSource");
    }

    /** 删除账号 */
    const handleDelete = (index) => {
        const temDataSource = dataSource.filter((item, i) => i + 1 !== index);
        store.set('tools_dataSource', temDataSource);
        // setDataSource(temDataSource);
    }

    return (
        <>
            <Button.Group>
                <Button onClick={() => setVisible(true)}>添加</Button>
                <Button
                    onClick={() => {
                        Modal.confirm({
                            title: '确定清空账号？',
                            onOk: () => {
                                clearAccount();
                            }
                        })
                    }}
                >清空账号</Button>
            </Button.Group>

            <Modal
                title='添加账号'
                width={400}
                visible={visible}
                onCancel={() => {
                    setVisible(false);
                    form.resetFields();
                    setIsEdit(prev => ({...prev, bool: false }))
                }}
                okText='确定'
                cancelText='取消'
                onOk={onOk}
                destroyOnClose
            >
                <Form
                    {...{
                        labelCol: {
                            span: 8
                        },
                        wrapperCol: {
                            span: 16
                        },
                        colon: true,
                        form
                    }}
                >
                    <Form.Item
                        name="account"
                        label="请输入账号"
                        rules={[
                            {
                                whitespace: true,
                                required: true,
                                message: '必填'
                            }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="请输入密码"
                        rules={[
                            {
                                whitespace: true,
                                required: true,
                                message: '必填'
                            }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="agent"
                        label="是否启用代理"
                        valuePropName="checked"
                        initialValue={false}
                    >
                        <Checkbox />
                    </Form.Item>
                </Form>
            </Modal>
            <Table
                className="account_table"
                rowKey={'id'}
                columns={[
                    {
                        title: '账号',
                        dataIndex: 'account',
                        ellipsis: true,
                        width: 100
                    },
                    {
                        title: '密码',
                        dataIndex: 'password',
                        ellipsis: true,
                        width: 100
                    },
                    {
                        title: '是否代理',
                        dataIndex: 'agent',
                        width: 70,
                        render: (text, row, index) => {
                            return text ? '是' : '否'
                        }

                    },
                    {
                        title: '创建时间',
                        dataIndex: 'createTime',
                        width: 90,
                    },
                    {
                        title: '账号状态',
                        dataIndex: 'status',
                        width: 90,
                        render: (text, row, index) => {
                            switch (text) {
                                case 1:
                                    return '新添加'
                                case 2:
                                    return '未登录'
                                case 10:
                                    return '正常'
                                default:
                                    return '未知'
                            }
                        }
                    },
                    {
                        title: '操作',
                        dataIndex: 'operation',
                        width: 300,
                        render: (text, row, index) => {
                            return (
                                <Space>
                                    <Button
                                        onClick={() => {
                                            setVisible(true);
                                            form.setFieldsValue(row);
                                            setIsEdit({
                                                bool: true,
                                                index: (pageNo - 1) * 10 + index + 1
                                            })
                                        }}
                                    >编辑</Button>
                                    <Button
                                        onClick={() => {
                                            login(row);
                                        }}
                                    >
                                        {row.status === 1 || row.status === 2 ? '登录' : '查看账号'}
                                    </Button>
                                    {/* <Button
                                        onClick={() => {
                                            testAccount(row);
                                        }}
                                    >测试账号</Button> */}
                                    <Button
                                        onClick={() => {
                                            if (isLoading) {
                                                notification.info({
                                                    message: '操作错误',
                                                    description: '正在运行，请勿再次执行'
                                                });
                                                return
                                            }
                                            setDataIndex((pageNo - 1) * 10 + index + 1);
                                        }}
                                        type='primary'
                                        loading={row.loading}
                                    >
                                        开始
                                    </Button>
                                    <Button type='ghost' onClick={() => handleDelete((pageNo - 1) * 10 + index + 1)}>删除</Button>
                                </Space>
                            )
                        }
                    }
                ]}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (selectedRowKeys, selectedRows) => {
                        setSelectedRowKeys(selectedRowKeys);
                        store.set('tools_dataSource_selected', selectedRows)
                    }
                }}
                dataSource={dataSource}
                pagination={{
                    pageSizeOptions: [10, 20],
                    pageSize: 10,
                    current: pageNo,
                    onChange: (page, pageSize) => {
                        setPageNo(page)
                    }
                }}
            />
        </>
    )
}

export default Index;