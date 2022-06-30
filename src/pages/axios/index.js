import { request } from "../utils/request";
import { publicKeyUsefuluRL } from './config';

export const checkPublickKey = (key) => {
    return request(`${publicKeyUsefuluRL}?token=${key}`, { method: 'GET', headers: { 'Content-Type': 'application/x-www-form-urlencoded', }, requestType: 'form' });
}