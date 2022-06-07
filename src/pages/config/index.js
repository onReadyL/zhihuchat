import React, { useState } from "react";
import { Form, Input, InputNumber } from 'antd';
import { FilePathCheck } from '../../components/index';

const Config = () => {

    const [toolsCofig, setToolsCofig] = useState(JSON.parse(localStorage.getItem('tools_config') || '{}'));

    const [form] = Form.useForm();

    const handleValidateFields = () => {
        form.validateFields().then((values) => {
            localStorage.setItem("tools_config", JSON.stringify(values));
        }).catch(errorInfo => {
            
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
                initialValue={50}
                rules={[
                    {
                        required: true,
                        message: '必填'
                    },
                ]}
            >
                <InputNumber onBlur={handleValidateFields} />
            </Form.Item>
            <Form.Item
                name="text"
                label="私信文本"
            >
                <Input.TextArea showCount={true} autoSize={{ maxRows: 5, minRows: 5 }} onBlur={handleValidateFields} />
            </Form.Item>
        </Form>
    )
}

export default Config;