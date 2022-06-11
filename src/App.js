import React, { useState, useEffect, useCallback } from "react";
import { CodeOutlined } from "@ant-design/icons";
import { Layout, Card, Button, Tabs, Space, notification } from "antd";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from './action';
import { opendevtool } from "./common";
import { Config, Account, Agent, About } from './pages/index';


import './App.css';

notification.config({
  duration: 3,
});

const APP = ({ receiveData, auth, }) => {
  const [tabKey, setTabKey] = useState('config');
  const [ipInfo, setIpInfo] = useState('');

  const fetchIp = useCallback(() => {
    fetch('/tools/MeasureApi.ashx?action=EAPI&secret=3C3935C58989D82AFA4C2173A3798E030254C3E22BD7FAB635EDC57B5666B886C5EA5A1CF7E6331E&number=1&orderId=SH20220602161248960_test&format=json', {
      method: 'GET'
    }).then(res => {
      return res.json();
    }).then(res => {
      // 206: ip数量用完 203: 需要添加白名单 406：提取间隔太快 215：单次提取数量超过上限
      const { status, left_time, domain, number, data = [] } = res;
      if (status === 'success') {
        setIpInfo(data[0])
      }
    })
  }, []);

  useEffect(() => {
    fetchIp();
  }, [fetchIp]);

  return (
    <Layout id="layout">
      <Layout.Content>
        <Card className="tools_card" bodyStyle={{ height: '100%', padding: '0px' }}>
          <Tabs activeKey={tabKey} onChange={setTabKey} type='card' style={{ height: '100%'}}>
            <Tabs.TabPane tab="配置" key="config">
              <Config />
            </Tabs.TabPane>
            <Tabs.TabPane tab="账号" key="account">
              <Account setTabKey={setTabKey} ip={ipInfo.IP}/>
            </Tabs.TabPane>
            {/* <Tabs.TabPane tab="代理" key="agent">
              <Agent />
            </Tabs.TabPane> */}
            <Tabs.TabPane tab="关于" key="about">
              <About />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </Layout.Content>
      <Layout.Footer>
        <Space>
          {/* <div>当前代理：{ipInfo.IP}</div>
          <Button onClick={() => { fetchIp() }}>重置代理</Button> */}
          <CodeOutlined onClick={opendevtool} title="控制台"/>
        </Space>
      </Layout.Footer>
    </Layout>
  );
};

const mapStateToProps = (state) => {
  const { auth = { data: {} } } = state.httpData;
  return { auth };
};
const mapDispatchToProps = (dispatch) => ({
  receiveData: bindActionCreators(receiveData, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(APP);