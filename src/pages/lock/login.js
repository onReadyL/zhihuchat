import React from "react";
import { Button, Form, Input, Space, notification } from 'antd';

import { login } from '../axios/index';

import { os } from '../../common';


const Index = ({ setTabKey, setLock }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        setLock(false);
        // login({ ...values, deviceId: 'chrome', deviceName: '浏览器' }).then(res => {
        //     if (!res) return;

        //     const { code, msg, data } = res;
        //     if (code === 500) {
        //         return notification.warn({
        //             message: '操作失败',
        //             description: msg
        //         })
        //     }
        //     if (code === 0) {
        //         const { token, uid } = data || {};
        //         // 此时调用支付接口
        //     }
        // })
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
                <h1 style={{ fontSize: '18px'}}>激活</h1>
            </div>
            <Form.Item
                name='username'
                label='机器码'
            >
                <Input />
            </Form.Item>
            <Form.Item
                name='pwd'
                label='激活码'
            >
                <Input/>
            </Form.Item>
            <Form.Item
                wrapperCol={{ span: 24, }}
            >
                <Space style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button htmlType="submit">激活</Button>
                    {/* <Button onClick={() => { setTabKey('register') }}>注册</Button> */}
                </Space>
            </Form.Item>
        </Form>
    )
};

export default Index;