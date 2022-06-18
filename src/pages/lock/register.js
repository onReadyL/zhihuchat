import React, { useEffect } from "react";
import { Button, Form, Input, Space, notification } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from '../../action';
import { checkPublickKey } from '../axios/index';
import { getMachineCode, decrypt } from '../utils/verify';
import { store } from '../../common';


const Index = ({ receiveData }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        const code = getMachineCode();
        if (code) {
            form.setFieldsValue({ username: code })
        }
    }, [form]);

    const handleFinish = (values) => {
        const { publicKey, code: tempCode } = values;
        checkPublickKey(publicKey).then(res => {
            if (!res) return;
            const { code, msg } = res;
            if (code === 0) {
                const str = decrypt(publicKey, tempCode);
    
                if (!str) return;
                const { offlineDate } = JSON.parse(str);
          
                const offlineTime = new Date(`${offlineDate} 00:00:00`).getTime();
                const now = new Date().getTime();
                store.set('publicKey', publicKey);
                    store.set('code', tempCode);
                if (offlineTime <= now ) {
                    receiveData(true, 'lock');
                    notification.warn({
                        message: '操作错误',
                        description: '激活码已过期，请重新激活'
                    })
                } else {
                  receiveData(false, 'lock');
                }
                return
            }
           
            notification.warn({
                message: '操作错误',
                description: '公钥验证不通过'
            });
             
        });
    };

    return (
        <Form
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 14 }}
            form={form}
            onFinish={handleFinish}
            initialValues={{
                publicKey: store.get('publicKey', ''),
                code: store.get('code',''),
            }}
            style={{ width: 500, backgroundColor:'Highlight' }}
        >
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                <h1 style={{ fontSize: '18px'}}>激活</h1>
            </div>
            <Form.Item
                name='username'
                label='机器码'
            >
                <Input readOnly={true} />
            </Form.Item>
            <Form.Item
                name='publicKey'
                label='公钥'
                rules={[
                    {
                        required: true,
                        message: '必填'
                    }
                ]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name='code'
                label='激活码'
                rules={[
                    {
                        required: true,
                        message: '必填'
                    }
                ]}
            >
                <Input/>
            </Form.Item>
            <Form.Item
                wrapperCol={{ span: 24, }}
            >
                <Space style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button htmlType="submit">激活</Button>
                </Space>
            </Form.Item>
        </Form>
    )
};

const mapStateToProps = (state) => {
    const { } = state.httpData;
    return { };
  };
const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Index);