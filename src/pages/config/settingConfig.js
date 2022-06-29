import React from "react";
import { Form, Input, Button, InputNumber, Checkbox, notification, Radio } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { store } from '../../common';
import { chat_max_count } from '../../constants/index';
import { FilePathCheck } from '../../components';
import { receiveData } from '../../action';

import './settingConfig.css';

const Index = ({ formProps, receiveData, settingConfig }) => {

    const [form] = Form.useForm();

    const handleFinish = (values) => {
        store.set('tools_setting_config', values);
        notification.success({
            message: '操作成功',
            description: '配置保存成功'
        });
        receiveData(values, 'settingConfig');
    }

    return (
        <Form
            {...formProps}
            {...{
                form,
                initialValues: settingConfig,
                onFinish: handleFinish
            }}
        >
            <Form.Item
                label="chrome"
                name='chromePath'
                rules={[
                    {
                        whitespace: true,
                        required: true,
                        message: '必填'
                    },
                ]}
            >
                <FilePathCheck  />
            </Form.Item>                       
            <Form.Item
                name="count"
                label="私信条数"
                validateFirst
                rules={[
                    {
                        required: true,
                        message: '必填'
                    },
                    {
                        type: 'number',
                        validator: (rules, value, callback) => {
                            if (value > chat_max_count) {
                                callback(`当前版本支持最多私信条数为:${chat_max_count}`)
                            }
                            callback()
                        }
                    }
                ]}
            >
                <InputNumber placeholder='私信条数' min={1} />
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
                <InputNumber min={1} addonAfter="秒" />
            </Form.Item>
            <Form.Item
                label='代理方式'
                name='agentType'
            >
                <Radio.Group>
                    <Radio value={'vps'}>VPS拨号</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item
                label='多开'
                name='mulOpen'
                valuePropName="checked"
            >
                <Checkbox />
            </Form.Item>
            <Form.Item
                name="random"
                label="随机私信"
                valuePropName="checked"
            >
                <Checkbox />
            </Form.Item>
            <Form.List
                name='texts'
                required={true}
                // rules={[
                //     {
                //         validator: async (_, names) => {
                //             if (!names || names.length < 1) {
                //                 return Promise.reject(new Error('至少一条私信'));
                //             }
                //       },
                //     },
                //   ]}
            >
                {(fields, { add, remove, move }, { errors }) => (
                    <>
                        {fields.map((field, index) => {
                            return (
                                <Form.Item
                                    {...(
                                        index === 0 ? {
                                                labelCol: { span: 5 },
                                                wrapperCol: { span: 19 },
                                        } : {
                                                wrapperCol: { span: 19, offset: 5 },
                                        }
                                    )}
                                    label={index === 0 ? '私信文本' : ''}
                                    required={false}
                                    key={field.key}
                                >
                                    <Form.Item
                                        {...field}
                                        validateTrigger={['onChange', 'onBlur']}
                                        noStyle
                                        rules={[
                                            {
                                              required: true,
                                              whitespace: true,
                                              message: "填入文本或删除此行",
                                            },
                                          ]}
                                    >
                                        <Input.TextArea style={{ width: '90%' }} autoSize={{ maxRows: 2, minRows: 2 }} showCount={true} />
                                    </Form.Item>
                                    <MinusCircleOutlined
                                        className="dynamic-delete-button"
                                        onClick={() => remove(field.name)}
                                    />
                                </Form.Item>
                            )
                        })}
                        <Form.Item
                            wrapperCol={{
                                span: 19,
                                offset: 5
                            }}
                        >
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                添加私信
                            </Button>
                        </Form.Item>
                        <Form.Item
                            wrapperCol={{
                                span: 19,
                                offset: 5
                            }}
                        >
                            <Form.ErrorList errors={errors} />
                        </Form.Item>
                    </>
                )}
            </Form.List>
            <Form.Item>
                <Button htmlType="submit" type="primary">保存配置</Button>
            </Form.Item>
        </Form>
    )

}

const mapStateToProps = (state) => {
    // const { } = state.httpData;
    return {  };
  };
  const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
  });
  
  export default connect(mapStateToProps, mapDispatchToProps)(Index);