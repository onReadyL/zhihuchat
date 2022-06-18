import { notification } from 'antd';
import { os, nodecrypto } from '../../common';

/** 机器码 */
export const getMachineCode = () => {
    try {
        const cpus = os.cpus();
        const cpusModal = cpus[0].model;
        const hash = nodecrypto.createHash('sha256');
        hash.update(cpusModal);
        return hash.digest('hex').substr(0, 20);        
    } catch (error) {
        console.log(error)
        notification.warn({
            message: '系统错误',
            description: '获取系统参数错误'
        });
        return
    }
};

/** 解密算法 */
export const decrypt = (publicKey, code) => {
    const algorithm = 'aes-192-cbc';
    const key = nodecrypto.scryptSync(publicKey, 'salt', 24);
    const iv = Buffer.alloc(16, 0);

    const decipher = nodecrypto.createDecipheriv(algorithm, key, iv);

    const encrypted = code;
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};