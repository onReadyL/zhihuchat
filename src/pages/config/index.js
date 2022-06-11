import React from "react";
import { Card, Row, Col } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import FunctionConfig from './functionConfig';
import SettingConfig from './settingConfig';

import { receiveData } from '../../action';
import { store } from '../../common';

import './index.css';

const Config = ({ settingConfig, funcConfig, selectedRows }) => {
    const formProps = {
        labelCol: {
            span: 6
        },
        wrapperCol: {
            span:  18
        },
        colon: true,
    }

    return (
        <Row className={'config_root'} gutter={12} style={{ height: '100%' }}>
            <Col span={12} style={{ height: '100%'}}>
                <Card title='环境配置' style={{ height: '100%', overflowY: 'scroll' }}>
                    <SettingConfig {...{ formProps, settingConfig: settingConfig.data }} />
                </Card>
            </Col>
            <Col span={12} style={{ height: '100%'}}>
                <Card title='功能配置' style={{ height: '100%', overflowY: 'scroll' }}>
                    <FunctionConfig {...{
                        formProps,
                        settingConfig: settingConfig.data,
                        funcConfig: funcConfig.data,
                        selectedRows: selectedRows.data
                    }} />
                </Card>
            </Col>
        </Row>
    )
}

const mapStateToProps = (state) => {
    const {
        loading = { data: false },
        settingConfig = { data: store.get('tools_setting_config', {}) },
        funcConfig = { data: store.get('tools_func_config', []) },
        selectedRows = { data: store.get('tools_dataSource_selected', [])}
    } = state.httpData;
    return { loading, settingConfig, funcConfig, selectedRows };
  };
const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
});

  export default connect(mapStateToProps, mapDispatchToProps)(Config);