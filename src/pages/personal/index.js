import React, { useEffect } from 'react';

import { request } from '../utils/request';


const Index = ({ }) => {
    
    useEffect(() => {
        request('https://api.it120.cc/onReadyL/user/check-token', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(res => {
            const { code } = res;
            debugger
        })
    }, [])
    return (
        <div>
            个人
        </div>
    )
};

export default Index;