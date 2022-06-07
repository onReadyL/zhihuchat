import React from "react";
import ReactDOM from "react-dom";
import thunk from "redux-thunk";
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';

import { ConfigProvider } from 'antd';
import moment from 'moment';
import "./index.css";
import App from "./App";
import reducer from "./reducer";
import "antd/dist/antd.css";

import zhCN from 'antd/lib/locale/zh_CN';

import 'moment/locale/zh-cn';

moment.locale('zh-cn');

const middleware = [thunk];
const store = createStore(reducer, applyMiddleware(...middleware));

const unsubscribe = store.subscribe((listener) => {
    // 全局state发生变化时订阅更新
    console.log(store.getState());
});

ReactDOM.render(
    <Provider store={store}>
        <ConfigProvider locale={zhCN} componentSize='small'>
            <App />
        </ConfigProvider>
    </Provider>,
    document.getElementById("root")
);
