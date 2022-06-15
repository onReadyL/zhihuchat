import React from "react";
import { Button, Form, Input, Space, notification } from 'antd';

import { register } from '../axios/index';


const Index = ({ setTabKey }) => {

    const [form] = Form.useForm();

    const handleFinish = (values) => {
        register(values).then(res => {
            if (!res) return;
            const { code } = res;
            if (code === 0) {
                return notification.success({
                    message: '操作成功',
                    description: '注册成功'
                })
            }
            if (code === 10000) {
                return notification.warn({
                    message: '操作失败',
                    description: '用户名重复'
                })
            }
        })
    };

    return (
        <Form
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            form={form}
            onFinish={handleFinish}
            style={{ width: 400, backgroundColor:'Highlight' }}
        >
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <h1 style={{ fontSize: '18px'}}>注册</h1>
            </div>
            <Form.Item
                name='username'
                label='用户名'
                rules={[
                    {
                        required: 'true',
                        message: '必填'
                    }
                ]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name='pwd'
                label='密码'
                rules={[
                    {
                        required: true,
                        message: '必填'
                    }
                ]}
                hasFeedback
            >
                <Input.Password />
            </Form.Item>
            <Form.Item
                name='confirm'
                label='确认密码'
                dependencies={['pwd']}
                rules={[
                    {
                        required: true,
                        message: '输入确认密码'
                    },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('pwd') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('两次输入密码不同'));
                        },
                      }),
                ]}
                hasFeedback
            >
                <Input.Password />
            </Form.Item>
            <Form.Item
                wrapperCol={{ span: 24, }}
            >
                <Space style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button onClick={() => {setTabKey('login')}}>返回登录</Button>
                    <Button htmlType="submit">注册</Button>
                </Space>
            </Form.Item>
        </Form>
    )
};

export default Index;