import React, { useState } from "react";
import { CodeOutlined } from "@ant-design/icons";
import { Layout, Card, Tabs, Space, notification, Button } from "antd";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from './action';
import { opendevtool } from "./common";
import { Config, Account, Agent, About, Personal, Lock } from './pages/index';
import { request } from './pages/utils/request'
import { getCookie } from './pages/utils/index';


import './App.css';

notification.config({
  duration: 3,
});

const APP = ({ receiveData, }) => {
  const [tabKey, setTabKey] = useState('config');

  const [lock, setLock] = useState(false);

  return (
    lock ? (<Lock setLock={setLock} />) : (
      <Layout id="layout">
        <Layout.Content>
          <Card className="tools_card" bodyStyle={{ height: '100%', padding: '0px' }}>
            <Tabs activeKey={tabKey} onChange={setTabKey} type='card' style={{ height: '100%'}}>
              <Tabs.TabPane tab="配置" key="config">
                <Config />
              </Tabs.TabPane>
              <Tabs.TabPane tab="账号" key="account">
                <Account setTabKey={setTabKey} ip={''}/>
              </Tabs.TabPane>
              {/* <Tabs.TabPane tab="代理" key="agent">
                <Agent />
              </Tabs.TabPane> */}
              <Tabs.TabPane tab="关于" key="about">
                <About />
              </Tabs.TabPane>
              <Tabs.TabPane tab="个人" key="personal">
                <Personal />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Layout.Content>
        <Layout.Footer>
          <Space>
            <CodeOutlined onClick={opendevtool} title="控制台" />
            <Button onClick={() => { setLock(true) }}>锁定</Button>
          </Space>
        </Layout.Footer>
      </Layout>)
  );
};

const mapStateToProps = (state) => {
  const {} = state.httpData;
  return { };
};
const mapDispatchToProps = (dispatch) => ({
  receiveData: bindActionCreators(receiveData, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(APP);