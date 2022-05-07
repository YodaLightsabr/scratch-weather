import { readFileSync } from 'fs';

const chars = readFileSync('chars', 'utf8').split('\n');
const uppercaseAlphabet = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`.split('');

export function transformUppercase (char) {
    if (uppercaseAlphabet.includes(char)) return chars[48 + uppercaseAlphabet.indexOf(char)];
    else return char;
}

export function encode (text) {
    return (new String(text)).split('').map(transformUppercase).map(char => ((chars.indexOf(char) + 1) || '36')).join('');
}

export function decode (data) {
    return (new String(data)).match(/.{1,2}/g).map(num => chars[+num - 1]).join('');
}