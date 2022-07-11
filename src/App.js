import React, { useCallback, useEffect, useState } from "react";
import { CodeOutlined } from "@ant-design/icons";
import { Layout, Card, Tabs, Space, notification } from "antd";
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { receiveData } from './action';
import { opendevtool, store } from "./common";
import { Config, Account, Agent, About, Personal, Lock } from './pages/index';
import { decrypt } from './pages/utils/verify';

import './App.css';

notification.config({
  duration: 3,
});

const APP = ({ lock, receiveData }) => {

  const verify = useCallback(() => {
    try {
      const publicKey = store.get('publicKey', '');
      const code = store.get('code', '');
      if (!publicKey || !code) {
        receiveData(true, 'lock');
        return false;
      };
      const str = decrypt(publicKey, code);
    
      if (!str) return;
      const { offlineDate } = JSON.parse(str);

      const offlineTime = new Date(`${offlineDate} 00:00:00`).getTime();
      const now = new Date().getTime();
      if (offlineTime <= now ) {
        receiveData(true, 'lock');
        return false;
      } else {
        receiveData(false, 'lock');
        return true;
      }
    } catch (error) {
      
    }
  }, [receiveData])

  useEffect(() => {
    verify();
  }, [verify]);

  const [tabKey, setTabKey] = useState('config');

  return (
    lock.data ? (<Lock />) : (
      <Layout id="layout">
        <Layout.Content>
          <Card className="tools_card" bodyStyle={{ height: '100%', padding: '0px' }}>
            <Tabs
              activeKey={tabKey}
              onChange={() => {
                setTabKey();
                verify();
              }}
              type='card'
              style={{ height: '100%' }}
            >
              <Tabs.TabPane tab="环境和功能配置" key="config">
                <Config verify={verify} />
              </Tabs.TabPane>
              <Tabs.TabPane tab="账号" key="account">
                <Account setTabKey={setTabKey} ip={''}/>
              </Tabs.TabPane>
              <Tabs.TabPane tab="代理配置" key="agent">
                <Agent />
              </Tabs.TabPane>
              <Tabs.TabPane tab="关于" key="about">
                <About />
              </Tabs.TabPane>
              {/* <Tabs.TabPane tab="个人" key="personal">
                <Personal />
              </Tabs.TabPane> */}
            </Tabs>
          </Card>
        </Layout.Content>
        <Layout.Footer>
          <Space>
            {process.env.NODE_ENV === "development" && (
              <CodeOutlined onClick={opendevtool} title="控制台" />
            )}
            <div>版本：v{require("../package.json").version}</div>
          </Space>
        </Layout.Footer>
      </Layout>)
  );
};

const mapStateToProps = (state) => {
  const { lock = { data: true }} = state.httpData;
  return { lock };
};

const mapDispatchToProps = (dispatch) => ({
  receiveData: bindActionCreators(receiveData, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(APP);