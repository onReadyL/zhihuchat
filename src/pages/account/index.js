import React, { useCallback, useEffect, useState } from "react";
import { Form, Input, Button, Table, message, Modal, Checkbox, Select, Space } from 'antd';

import { puppeteer, child_process, chromeRemoteInterface, Version, waitFor } from '../../utils';
import './index.css';

const groups = [{ value: '1', label:'一组'}, { value: '2', label: '二组'}, { value: '3', label: '三组'}, { value: '4', label: '四组'}]

const Index = ({ setTabKey, ip }) => {

    const [visible, setVisible] = useState(false);

    const [dataSource, setDataSource] = useState(JSON.parse(localStorage.getItem('tools_dataSource') || '[]'));

    const [pageNo, setPageNo] = useState(1);

    const [form] = Form.useForm();

    const [dataIndex, setDataIndex] = useState();

    const [isEdit, setIsEdit] = useState({
        index: 0,
        bool: false
    });

    const begin = async (values, isLast) => {
        const { account, password, agent = false, group } = values;

        /** 配置 */
        const { path, url, count, text } = JSON.parse(localStorage.getItem("tools_config") || '{}');
        if (!path) {
            message.info("请先配置本地chrome路径");
            setTimeout(() => {
                setTabKey('config');
            }, 1500);
            return;
        };
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
                    message.warning('未登录');
                    setDataIndex();
                    return;
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
                        // setDataIndex((prev) => {
                        //     return prev + 1;
                        // });
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

                    let isVoters;
                    try {
                        isVoters = await page1.waitForSelector(".Voters", { timeout: 30000 }).then(res => {
                            return !!res;
                        });
                    } catch (error) {
                        console.log(error)
                        message.info('请检查网络问题或稍后重试');
                        setDataIndex();
                        await browser.close();
                        return;
                    }
                    
                    if (!isVoters) {
                        message.info('当前文章无人点赞！');
                        await browser.close();
                        setDataIndex()
                        return;
                    }

                    await page1.waitForSelector('.Voters > button', { timeout: 3000 }).then(res => res.click({ delay: 500 }));
                    await page1.waitForSelector('.VoterList > .VoterList-content .List-item', { timeout: 10000 });
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

                    const total = postCount < count ? postCount : count;
                    const voterList = await voterContent.$$('.List-item');
                    
                    /** 循环点击赞同列表并发私信 */
                    try {
                        for (let i = 0; i < total; i++) {
                            await waitFor(1000); // 间隔时间
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
                            await textarea.type(text, { delay: 1000 });
                            await waitFor(1000);
                            await newPage.$(".InputBox-sendBtn").then(res => res.click());
                        }
                        await waitFor(2000);
                        await browser.close();
                        setDataIndex((prev) => {
                            return prev + 1;
                        });
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
    
    const handleBegin = useCallback(async () => {
        if (dataIndex && dataIndex <= dataSource.length) {
            await begin(dataSource[dataIndex - 1]);
            setDataSource(prev => {
                return prev.map((item, index) => {
                    return { ...item, loading: index === dataIndex - 1}
                })
            })
        } else {
            setDataIndex();
            setDataSource((prev) => {
                return prev.map(item => ({...item, loading: false }))
            })
        }
     }, [dataIndex]);

    useEffect(() => {
        handleBegin();
    }, [handleBegin])
   

    /** 确定添加账号 */
    const onOk = () => {
        form.validateFields().then((values) => {
            let tempValues;
            if (isEdit.bool) {
                tempValues = dataSource.map((item, index) => {
                    if (isEdit.index - 1 === index) {
                        return values;
                    } else {
                        return item
                    }
                })
            } else {
                tempValues = [...dataSource, values];
            }

            localStorage.setItem('tools_dataSource', JSON.stringify(tempValues));
            setDataSource(tempValues);
            form.resetFields();
            setIsEdit((prev) => ({ ...prev, bool: false }));
            setVisible(false);
        })
    }

    /** 删除账号 */
    const handleDelete = (index) => {
        const temDataSource = dataSource.filter((item, i) => i + 1 !== index);
        localStorage.setItem('tools_dataSource', JSON.stringify(temDataSource));
        setDataSource(temDataSource);
       
    }

    return (
        <>
            <Button.Group>
                <Button onClick={() => setVisible(true)}>添加</Button>
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
                    <Form.Item
                        name="group"
                        label="分组"
                    >
                        <Select options={groups} />
                    </Form.Item>
                </Form>
            </Modal>
            <Table
                className="account_table"
                columns={[
                    {
                        title: '账号',
                        dataIndex: 'account',
                        ellipsis: true,
                    },
                    {
                        title: '密码',
                        dataIndex: 'password'
                    },
                    {
                        title: '是否代理',
                        dataIndex: 'agent',
                        width: 100,
                        render: (text, row, index) => {
                            return text ? '是' : '否'
                        }

                    },
                    {
                        title: '分组',
                        dataIndex: 'group',
                        width: 100,
                        render: (text, row, index) => {
                            return (groups.find(item => item.value === text) || { label: ''}).label
                        }
                    },
                    {
                        title: '操作',
                        dataIndex: 'operation',
                        width: 200,
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
                                            setDataIndex((pageNo - 1) * 10 + index + 1)
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