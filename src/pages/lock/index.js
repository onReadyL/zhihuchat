import React, { useState } from "react";
import { Button, Layout, Space } from "antd";
import { request } from "../utils/request";

import './index.css';

import Register from "./register";
import Login from './login';

const Index = ({ setLock }) => {
    const [tabKey, setTabKey] = useState('login');
   
    return (
        <Layout id='lock'>
            <Layout.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                {/* {tabKey === 'register' && (
                    <Register setTabKey={setTabKey} />
                )} */}
                {tabKey === 'login' && (
                    <Login setTabKey={setTabKey} setLock={setLock} />
                )}
            </Layout.Content>
        </Layout>
    )
};

export default Index;