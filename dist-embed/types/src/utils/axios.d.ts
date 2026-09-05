import { AxiosRequestConfig, AxiosStatic } from 'axios';
type TFetchRequestConfigParams = AxiosRequestConfig & Record<string, any>;
type TFetchMethod = keyof Pick<AxiosStatic, 'get' | 'post' | 'put' | 'getUri' | 'request' | 'delete' | 'head' | 'options' | 'patch'>;
declare const fetch: <T = any>(url: string, params: TFetchRequestConfigParams, type?: TFetchMethod, exheaders?: Record<string, any>, extra?: Record<string, any>) => Promise<T>;
export default fetch;
