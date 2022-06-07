import React from "react";
import ReactDOM from "react-dom";
import { ConfigProvider } from 'antd';
import moment from 'moment';
import "./index.css";
import App from "./App";
import "antd/dist/antd.css";

import zhCN from 'antd/lib/locale/zh_CN';

import 'moment/locale/zh-cn';

moment.locale('zh-cn');

ReactDOM.render(<ConfigProvider locale={zhCN} componentSize='small'><App /></ConfigProvider>, document.getElementById("root"));
