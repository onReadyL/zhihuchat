/** 最大私信条数 */
export const chat_max_count = process.env.NODE_ENV === 'development' ? 1000000 : process.env.REACT_APP_CHAT_MAX_COUNT;

/** chrome地址 */
export const chromePath = process.env.NODE_ENV === 'development' ? `D:\\Chrome-CES\\App\\chrome.exe` : `${process.cwd()}\\resources\\Chrome\\App\\chrome.exe`; // chrome地址