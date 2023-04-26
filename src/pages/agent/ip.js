import React, { useState } from "react";
import { Form, Input, Space, Button, notification } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { store } from "../../common";
import { getIp } from "../utils/index";
import { receiveData } from '../../action';

const Index = ({ formProps, ipConfig, receiveData }) => {
    const [form] = Form.useForm();
    const ipUrl = Form.useWatch('ipUrl', form);
    const [testing, setTesting] = useState(false);

    const handleFinish = (values) => {
        store.set('tools_ip_config', values);
        notification.success({
            message: '操作成功',
            description: '配置保存成功'
        });
        receiveData(values, 'ipConfig');
    };

    const handleTest = async () => {
        setTesting(true);
        const ip = await getIp({ ipUrl, notice: true });
        debugger
        setTesting(false);
    }

    return (
        <Form
            {...formProps}
            form={form}
            initialValues={ipConfig}
            onFinish={handleFinish}
        >
            <Form.Item
                label='地址'
                name={'ipUrl'}
            >
                <Input.TextArea autoSize={{ maxRows: 5, minRows: 5 }}/>
            </Form.Item>
            <Form.Item>
                <Space>
                    <Button htmlType="submit" disabled={!ipUrl} type="primary">保存配置</Button>
                    <Button loading={testing} disabled={!ipUrl} type="primary" onClick={handleTest}>测试</Button>
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