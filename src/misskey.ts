import axios from 'axios';
import _const from './const';

export const ua = `Mozilla/5.0 misshaialertBot/${_const.version} +https://github.com/Xeltica/misshaialert Node/${process.version}`;

axios.defaults.headers['User-Agent'] = ua;

axios.defaults.validateStatus = (stat) => stat < 500;

export const api = <T>(host: string, endpoint: string, arg: Record<string, unknown>, i?: string): Promise<T> => {
	const a = { ...arg };
	if (i) {
		a.i = i;
	}
	return axios.post<T>(`https://${host}/api/${endpoint}`, a).then(res => res.data);
};