import React from "react";
import { Input } from 'antd';
import './index.css';

const Index = ({ value, onChange, ...resProps }) => {

    const handleFileChange = (e) => {
        const files = document.getElementById('file').files;
        const path = files[0].path;
        onChange && onChange(path);
        document.querySelector('#file').value = '';
    }

    const handleFocus = (e) => {
        document.querySelector('#file').click();
        e.target.blur();
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Input value={value} style={{ flex: 1 }} onFocus={handleFocus}/>
            <input type={'file'} id="file" accept=".exe" onChange={handleFileChange} />
        </div>
    )
};

export default Index;