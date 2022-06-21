import React, { useState } from "react";
import { Card, Radio, Space, Row, Col } from 'antd';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Vps from './vps';
import Ip from './ipConfig';
import { receiveData } from '../../action';
import { store } from '../../common';

const Index = ({ vpsConfig  }) => {
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
            {/* <Col span={12}  style={{ height: '100%'}}>
                <Ip />
            </Col> */}
        </Row>
       
    )
};

const mapStateToProps = (state) => {
    const { vpsConfig = { data: store.get('tools_vps_config', {}) } } = state.httpData;
    return { vpsConfig  };
};
  
const mapDispatchToProps = (dispatch) => ({
receiveData: bindActionCreators(receiveData, dispatch),
});

  export default connect(mapStateToProps, mapDispatchToProps)(Index);