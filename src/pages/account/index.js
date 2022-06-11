import React, { useState } from "react";
import { Form, Input, Button, Table, Modal, Checkbox, Space, notification } from 'antd';
import { nanoid } from 'nanoid';
import moment from "moment";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from '../../action';
import { store } from '../../common';
import { login, testAccount } from '../utils/index';

import './index.css';

const Index = ({ selectedRows, receiveData }) => {

    const [visible, setVisible] = useState(false);

    const [dataSource, setDataSource] = useState(store.get('tools_dataSource', [])); // 账号数据
    
    store.onDidChange('tools_dataSource', (newValue, oldValue) => {
        setDataSource(newValue || []);
    })

    const [selectedRowKeys, setSelectedRowKeys] = useState(selectedRows.data.map(item => item.id)); // 选中

    const [pageNo, setPageNo] = useState(1);

    const [form] = Form.useForm();

    const [isEdit, setIsEdit] = useState({
        index: 0,
        bool: false
    });

    /** 确定添加账号 */
    const onOk = () => {
        form.validateFields().then((values) => {
            let tempValues;
            if (isEdit.bool) {
                tempValues = dataSource.map((item, index) => {
                    if (isEdit.index - 1 === index) {
                        return {...item, ...values};
                    } else {
                        return item
                    }
                })
            } else {
                const isExsit = dataSource.find(item => item.account === values.account);
                if (!!isExsit) {
                    return notification.warn({
                        message: '操作错误',
                        description: '该账号已存在'
                    })
                }
                tempValues = [...dataSource, {...values, id: nanoid(10), status: 1, createTime: moment().format('YYYY-MM-DD') }];
            }
            store.set('tools_dataSource', tempValues);
            // setDataSource(tempValues);
            form.resetFields();
            setIsEdit((prev) => ({ ...prev, bool: false }));
            setVisible(false);
        })
    }

    /** 清空账号 */
    const clearAccount = () => {
        // setDataSource([]);
        store.delete("tools_dataSource");
    }

    /** 删除账号 */
    const handleDelete = (index) => {
        const temDataSource = dataSource.filter((item, i) => i + 1 !== index);
        store.set('tools_dataSource', temDataSource);
    }

    return (
        <>
            <Button.Group>
                <Button onClick={() => setVisible(true)}>添加</Button>
                <Button
                    onClick={() => {
                        Modal.confirm({
                            title: '确定清空账号？',
                            onOk: () => {
                                clearAccount();
                            }
                        })
                    }}
                >清空账号</Button>
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
                </Form>
            </Modal>
            <Table
                className="account_table"
                rowKey={'id'}
                columns={[
                    {
                        title: '账号',
                        dataIndex: 'account',
                        ellipsis: true,
                        width: 100
                    },
                    {
                        title: '密码',
                        dataIndex: 'password',
                        ellipsis: true,
                        width: 100
                    },
                    {
                        title: '是否代理',
                        dataIndex: 'agent',
                        width: 70,
                        render: (text, row, index) => {
                            return text ? '是' : '否'
                        }

                    },
                    {
                        title: '创建时间',
                        dataIndex: 'createTime',
                        width: 90,
                    },
                    {
                        title: '账号状态',
                        dataIndex: 'status',
                        width: 90,
                        render: (text, row, index) => {
                            switch (text) {
                                case 1:
                                    return '新添加'
                                case 2:
                                    return '未登录'
                                case 10:
                                    return '正常'
                                case 4039:
                                    return '账号异常'
                                default:
                                    return '未知'
                            }
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
                                            login(row);
                                        }}
                                    >
                                        {row.status === 1 || row.status === 2 ? '登录' : '查看账号'}
                                    </Button>
                                    {/* <Button
                                        onClick={() => {
                                            testAccount(row);
                                        }}
                                    >测试账号</Button> */}
                                    <Button type='ghost' onClick={() => handleDelete((pageNo - 1) * 10 + index + 1)}>删除</Button>
                                </Space>
                            )
                        }
                    }
                ]}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (selectedRowKeys, selectedRows) => {
                        setSelectedRowKeys(selectedRowKeys);
                        store.set('tools_dataSource_selected', selectedRows);
                        receiveData(selectedRows, 'selectedRows');
                    }
                }}
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


const mapStateToProps = (state) => {
    const {  selectedRows = { data: store.get('tools_dataSource_selected', []) } } = state.httpData;
    return {  selectedRows };
  };
const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
});

  export default connect(mapStateToProps, mapDispatchToProps)(Index);