import 'reflect-metadata';
import axios from 'axios';
import {config} from './config.js';

export const ua = `Mozilla/5.0 MisskeyTools +https://github.com/shrimpia/misskey-tools Node/${process.version} ${config.uaExtra ?? ''}`;

axios.defaults.headers['User-Agent'] = ua;
axios.defaults.headers['Content-Type'] = 'application/json';
axios.defaults.validateStatus = (stat) => stat < 500;

(async () => {
  (await import('./boot/server.js')).default();
  (await import('./boot/worker.js')).default();
})();