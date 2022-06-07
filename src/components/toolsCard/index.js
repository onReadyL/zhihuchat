import React from "react";
import { Divider } from 'antd';

import './index.css';

const Index = ({ title = '块', children }) => {
    return (
        <div id='tools_card'>
            <Divider orientation="left" >{ title }</Divider>
            {children}
        </div>
    )
};

export default Index;