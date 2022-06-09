import React, { useState } from "react";
import { Form, Input, InputNumber } from 'antd';

import { FilePathCheck } from '../../components/index';
import { dafault_count } from '../../constants/index';
import { store } from '../../common';

const Config = () => {

    const [toolsCofig, setToolsCofig] = useState(store.get('tools_config', {}));

    const [form] = Form.useForm();

    const handleValidateFields = () => {
        form.validateFields().then((values) => {
            store.set('tools_config', values);
        }).catch(({ values }) => {
            store.set('tools_config', values);
        })
    };

    return (
        <Form
            {...{
                labelCol: {
                    span: 5
                },
                wrapperCol: {
                    span: 17
                },
                colon: true,
                form,
                initialValues: toolsCofig
            }}
        >
            <Form.Item
                label="chrome路径"
                name='path'
                rules={[
                    {
                        whitespace: true,
                        required: true,
                        message: '必填'
                    },
                ]}
            >
                <FilePathCheck onChange={handleValidateFields} />
            </Form.Item>
            <Form.Item
                name="url"
                label="知乎专栏链接"
                rules={[
                    {
                        whitespace: true,
                        required: true,
                        message: '必填'
                    },
                    {
                        pattern: /zhuanlan.zhihu.com\/p/g,
                        message: '请输入正确文章格式'
                    }
                ]}
            >
                <Input onBlur={handleValidateFields} />
            </Form.Item>
            <Form.Item
                name="count"
                label="私信条数"
                initialValue={dafault_count}
                rules={[
                    {
                        required: true,
                        message: '必填'
                    },
                ]}
            >
                <InputNumber placeholder="请输入私信条数，默认20" min={1} onBlur={handleValidateFields} />
            </Form.Item>
            <Form.Item
                name="chat_interval"
                label="私信间隔"
                rules={[
                    {
                        required: true,
                        message: '必填'
                    },
                ]}
            >
                <InputNumber onBlur={handleValidateFields} min={1} addonAfter="秒" />
            </Form.Item>
            <Form.Item
                name="text"
                label="私信文本"
                rules={[
                    {
                        required: true,
                        whitespace: true,
                        message: '必填'
                    },
                ]}
            >
                <Input.TextArea showCount={true} autoSize={{ maxRows: 5, minRows: 5 }} onBlur={handleValidateFields} />
            </Form.Item>
        </Form>
    )
}

export default Config;