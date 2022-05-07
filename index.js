import Scratch from 'scratch-api';
import fetch from 'node-fetch';
import express from 'express';

import { encode, decode } from './encoder.js';
import { createQueue } from './queue.js';
import { getCreds } from './config.js';
const { username, password, weatherKey } = getCreds();

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const queue = createQueue();

function getIcon (url) {
    let icon;
    if (url.includes('night')) {
        icon = `${url.substring(
            url.lastIndexOf('/') + 1,
            url.lastIndexOf('.png')
        )}-night`;
    } else {
        icon = `${url.substring(
            url.lastIndexOf('/') + 1,
            url.lastIndexOf('.png')
        )}-day`;
    }
    console.log({ url, icon });
    return icon;
}

function cutOff (str) {
    if (str.length < 30) return str;
    return `${str.substring(0, 27)}...`;
}

Scratch.UserSession.create(username, password, function(err, user) {

    user.cloudSession(686722628, function(err, cloud) {

        cloud.on('set', function(name, value) {
            console.log({ name, value });
            if (name === '☁ ASK' && value != '0') queue.push(decode(value));
        });

        console.log(Math.round(Date.now() / 1000 - 946684800));

        setInterval(() => {
            cloud.set('☁ LOG REFRESH', Math.round(Date.now() / 1000 - 946684800));
        }, 5000);

        queue.handleInterval(3000, async location => {
            console.log(`Handling ${location}`);
            const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${weatherKey}&q=${encodeURIComponent(location)}&aqi=no`);
            const data = await response.json();
            console.log(data);
            const condition = data?.current?.condition?.text ?? 'Unknown';
            const temperature = data?.current?.temp_f ?? '0';
            const icon = getIcon(data?.current?.condition?.icon);
            const city = cutOff(data?.location?.name ? (
                data?.location?.region ? (
                    data?.location?.name + ', ' + data?.location?.region
                ) : data?.location?.name
            ) : 'Unknown');
            cloud.set('☁ TEMP', encode(temperature));
            await sleep(600);
            cloud.set('☁ LOCATION', encode(city));
            await sleep(600);
            cloud.set('☁ WEATHER', encode(condition));
            await sleep(600);
            cloud.set('☁ ICON', encode(icon));
            await sleep(600);
            cloud.set('☁ ID', encode(location));
            console.log({ condition, temperature, city, location, icon, ts: Date.now() });
        });

    });
});

const app = express();
app.get('/', (req, res) => {
    res.send('OK');
});
app.listen(8080, () => {
    console.log('Listening on *:8080');
});