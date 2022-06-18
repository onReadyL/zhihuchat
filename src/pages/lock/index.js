import React from "react";
import { Layout } from "antd";

import './index.css';

import Register from './register';

const Index = ({  }) => {   
    return (
        <Layout id='lock'>
            <Layout.Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <Register   />
            </Layout.Content>
        </Layout>
    )
};

export default Index;