import { readFileSync } from 'fs';

export function getCreds () {
    return {
        username: process.env.USERNAME || readFileSync('creds.username', 'utf8'),
        password: process.env.PASSWORD || readFileSync('creds.password', 'utf8'),
        weatherKey: process.env.APIKEY || readFileSync('weather.key', 'utf8')
    }
}