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
    if (err) console.error(err);
    console.log('Logged in');

    user.cloudSession(686722628, function(err, cloud) {
        if (err) console.error(err);
        console.log('Connected');
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
            let data = {};
            try {
                data = await response.json();
            } catch (err) {
                data.error = err;
            }
            console.log(data);
            if (data.error) {
                console.log('Handling error');
                cloud.set('☁ TEMP', encode('0'));
                await sleep(500);
                cloud.set('☁ LOCATION', encode('Not Found'));
                await sleep(500);
                cloud.set('☁ WEATHER', encode('Not Found'));
                await sleep(500);
                cloud.set('☁ ICON', encode('113-day'));
                await sleep(500);
                cloud.set('☁ DETAILS', encode('You entered an invalid location.'));
                await sleep(500);
                cloud.set('☁ ID', encode(location));
    
                return;
            };
            const condition = data?.current?.condition?.text ?? 'Unknown';
            const temperature = data?.current?.temp_f ?? '0';
            const icon = getIcon(data?.current?.condition?.icon);
            const city = cutOff(data?.location?.name ? (
                data?.location?.region ? (
                    data?.location?.name + ', ' + data?.location?.region
                ) : data?.location?.name
            ) : 'Unknown');
            const details = `Humidity: ${data?.current?.humidity ?? '0'}%  |  Wind: ${data?.current?.wind_mph ?? '0'} mph  |  Precipitation: ${data?.current?.precip_in ?? '0'} in`;
            cloud.set('☁ TEMP', encode(temperature));
            await sleep(500);
            cloud.set('☁ LOCATION', encode(city));
            await sleep(500);
            cloud.set('☁ WEATHER', encode(condition));
            await sleep(500);
            cloud.set('☁ ICON', encode(icon));
            await sleep(500);
            cloud.set('☁ DETAILS', encode(details));
            await sleep(500);
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