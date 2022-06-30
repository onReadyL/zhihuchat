import React, { useState } from "react";
import { Form, Input, Button, notification, Space } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { store } from "../../common";
import { receiveData } from '../../action';
import { testVps } from '../utils/index';

const Index = ({ formProps, vpsConfig, receiveData }) => {

    const [form] = Form.useForm();

    const [testing, setTesting] = useState(false);

    const vpsName = Form.useWatch('vpsName', form);
    const vpsAccount = Form.useWatch('vpsAccount', form);
    const vpsPassword = Form.useWatch('vpsPassword', form);

    const handleFinish = (values) => {
        store.set('tools_vps_config', values);
        notification.success({
            message: '操作成功',
            description: '配置保存成功'
        });
        receiveData(values, 'vpsConfig');
    };

    const handleTestVps = async () => {
        setTesting(true)
        const result = await testVps({ vpsName, vpsAccount, vpsPassword });
        setTesting(false);
        receiveData(result, 'vpsTest');
        store.set('tools_vps_test', result);
        if (result) {
            notification.success({
                message: '操作成功',
                description: '拨号连接成功，并已连接到网络'
            });
        } else {
            notification.error({
                message: '操作失败',
                description: '拨号连接失败，请检查信息是否正确'
            });
        }
    };

    return (
        <Form
            {...formProps}
            form={form}
            initialValues={vpsConfig}
            onFinish={handleFinish}
        >
            <Form.Item
                label='名称'
                name={'vpsName'}
                rules={[{
                    required: true,
                    message: '必填'
                }]}
            >
                <Input placeholder="eg: 宽带连接" />
            </Form.Item>
            <Form.Item
                label='账号'
                name='vpsAccount'
                rules={[{
                    required: true,
                    message: '必填'
                }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                label='密码'
                name={'vpsPassword'}
                rules={[{
                    required: true,
                    message: '必填'
                }]}
            >
                <Input.Password />
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button htmlType="submit" disabled={!(vpsAccount && vpsName && vpsPassword)} type="primary">保存配置</Button>
                    <Button loading={testing} disabled={!(vpsAccount && vpsName && vpsPassword)} type="primary" onClick={handleTestVps}>测试</Button>
                </Space>
            </Form.Item>
        </Form>
       
    )
};

const mapStateToProps = (state) => {
    // const { } = state.httpData;
    return {  };
  };
  const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
  });
  
  export default connect(mapStateToProps, mapDispatchToProps)(Index);