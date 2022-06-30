import React from "react";
import { Card, Row, Col } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Vps from './vps';
import Ip from './ip';
import { receiveData } from '../../action';
import { store } from '../../common';

const Index = ({ vpsConfig, ipConfig  }) => {
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
        <Row gutter={12} style={{ height: '100%' }}>
            <Col span={12} style={{ height: '100%' }}>
                <Card title='VPS拨号' style={{ height: '100%'}}>
                    <Vps {...{ formProps, vpsConfig: vpsConfig.data }} />
                </Card>
            </Col>
            <Col span={12} style={{ height: '100%' }}>
                <Card title='代理IP' style={{ height: '100%' }}>
                    <Ip {...{ formProps, ipConfig: ipConfig.data }} />
                </Card>
            </Col>
        </Row>
       
    )
};

const mapStateToProps = (state) => {
    const {
        vpsConfig = { data: store.get('tools_vps_config', {}) },
        ipConfig = { data: store.get('tools_ip_config', {}) }
    } = state.httpData;
    return { vpsConfig, ipConfig  };
};
  
const mapDispatchToProps = (dispatch) => ({
receiveData: bindActionCreators(receiveData, dispatch),
});

  export default connect(mapStateToProps, mapDispatchToProps)(Index);