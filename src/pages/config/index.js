import React from "react";
import { Card, Row, Col } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import FunctionConfig from './functionConfig';
import SettingConfig from './settingConfig';

import { receiveData } from '../../action';
import { store } from '../../common';

import './index.css';

const Config = ({
    settingConfig,
    funcConfig,
    selectedRows,
    vpsConfig,
    vpsTest,
    verify,
}) => {
    const formProps = {
        labelCol: {
            span: 5
        },
        wrapperCol: {
            span:  19
        },
        colon: true,
    }

    return (
        <Row className={'config_root'} gutter={8} style={{ height: '100%' }}>
            <Col span={12} style={{ height: '100%'}}>
                <Card title='环境配置' style={{ height: '100%', overflowY: 'scroll' }}>
                    <SettingConfig {...{
                        formProps,
                        settingConfig: settingConfig.data,
                    }} />
                </Card>
            </Col>
            <Col span={12} style={{ height: '100%'}}>
                <Card title='功能配置' style={{ height: '100%', overflowY: 'scroll' }}>
                    <FunctionConfig {...{
                        formProps,
                        settingConfig: settingConfig.data,
                        funcConfig: funcConfig.data,
                        selectedRows: selectedRows.data,
                        vpsConfig: vpsConfig.data,
                        vpsTest: vpsTest.data,
                        verify
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
        selectedRows = { data: store.get('tools_dataSource_selected', []) },
        vpsConfig = { data: store.get('tools_vps_config', {}) },
        vpsTest = { data: store.get('tools_vps_test', false ) }
    } = state.httpData;
    return { loading, settingConfig, funcConfig, selectedRows, vpsConfig, vpsTest };
  };
const mapDispatchToProps = (dispatch) => ({
    receiveData: bindActionCreators(receiveData, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Config);