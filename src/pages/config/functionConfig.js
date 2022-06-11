import React, { useState } from "react";
import { Form, Input, Row, Col, Button, notification } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from '../../action';
import { store, waitFor } from '../../common';
import { begin } from '../utils';

const Index = ({ formProps, receiveData, loading, settingConfig, funcConfig, selectedRows }) => {

    const [form] = Form.useForm();

    /** 配置 */
    const { chromePath, count, chat_interval, random, texts } = settingConfig;

    const [isLoading, setIsLoading] = useState(false);

    const [activeKey, setActiveKey] = useState();

    const handleFinish = (values) => {
        store.set('tools_func_config', values);
        notification.success({
            message: '操作成功',
            description: '配置保存成功'
        });
    };

    const handleBegin = async (field, selectedData) => {
        const value = form.getFieldValue(field);

        if (!value) {
            notification.warn({
                message: '操作错误',
                description: '添加链接'
            });
            return;
        }
        if (!selectedData.length) {
            notification.warn({
                message: '操作错误',
                description: '请勾选数据'
            });
            return
        };
        if (!chromePath) {
            notification.warn({
                message: '配置错误',
                description: '未配置chrome地址'
            });
            return
        };
        if (!texts || !texts.length) {
            notification.warn({
                message: '配置错误',
                description: '未配置私信文本'
            });
            return
        }
        setActiveKey(field)
        for (let i = 0; i < selectedData.length; i++){
            try {
                await begin(selectedData[i], settingConfig, value, field);
            } catch (error) {
                console.log(error);
                break;
            }
        }
        setActiveKey();
    };

    return (
        <Form
            {...formProps}
            form={form}
            onFinish={handleFinish}
            initialValues={funcConfig}
        >
            <Row>
                <Col span={18}>
                    <Form.Item
                        name="article_url"
                        label="专栏链接"
                        rules={[
                            {
                                pattern: /zhuanlan.zhihu.com\/p/g,
                                message: '请输入正确文章格式'
                            }
                        ]}
                    >
                        <Input />
                    </Form.Item> 
                </Col>
                <Col span={6}>
                    <Button.Group>
                        <Button
                            type='primary'
                            loading={activeKey === 'article_url'}
                            onClick={async () => {
                                if (activeKey) {
                                    notification.warn({
                                        message: '操作错误',
                                        description: '有任务正在进行，请关闭任务重试'
                                    });
                                    return
                                }
                                await handleBegin('article_url', selectedRows)
                            }}
                        >开始</Button>
                        {/* <Button
                            danger
                            onClick={() => {
                                // setIsLoading(false)
                               test('手动停止');
                            }}
                        >停止</Button> */}
                    </Button.Group>
                </Col>
            </Row>
            <Row>
                <Col span={18}>
                    <Form.Item
                        name="user_url"
                        label="用户地址"
                        rules={[
                            {
                                pattern: /\/people\//g,
                                message: '请输入正确格式'
                            }
                        ]}
                    >
                        <Input />
                    </Form.Item> 
                </Col>
                <Col span={6}>
                    <Button.Group>
                        <Button
                            loading={activeKey === 'user_url'}
                            type='primary'
                            onClick={async () => {
                                if (activeKey) {
                                    notification.warn({
                                        message: '操作错误',
                                        description: '有任务正在进行，请关闭任务重试'
                                    });
                                    return
                                }
                                await handleBegin('user_url', selectedRows)
                            }}
                        >开始</Button>
                        {/* <Button
                            danger
                            onClick={() => {
                                setActiveKey()
                            }}
                        
                        >停止</Button> */}

                    </Button.Group>
                </Col>
            </Row>
            <Form.Item>
                <Button htmlType="submit" type="primary">保存配置</Button>
            </Form.Item>
        </Form>
    )
}

const mapStateToProps = (state) => {
    const { loading = { data: false } } = state.httpData;
    return { loading };
  };
  const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
  });

  export default connect(mapStateToProps, mapDispatchToProps)(Index);