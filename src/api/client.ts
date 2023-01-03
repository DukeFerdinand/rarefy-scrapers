import {logger} from "../logger";
import axios, {AxiosInstance, CreateAxiosDefaults} from "axios";

export class ApiClient {
	private readonly client: AxiosInstance;
	private readonly baseUrl: string;

	constructor(baseUrl: string | undefined, fetchOptions: CreateAxiosDefaults<any>) {
		if (!baseUrl) {
			throw new Error('baseUrl is required for ApiClient');
		}

		this.baseUrl = baseUrl;
		this.client = axios.create({
			baseURL: baseUrl,
			...fetchOptions
		});
	}

	async get<T>(path: string): Promise<T> {
		const response = await this.client.get(`${this.baseUrl}${path}`);

		if (response.status !== 200) {
			throw new Error(`Request failed with status code ${response.status}`);
		}

		return await response.data;
	}

	async post<D, T>(path: string, body: D): Promise<T> {
		logger.info(`Posting to ${path}`)
		const response = await this.client.post(path, body);

		if (response.status !== 200) {
			throw new Error(`Request failed with status code ${response.status}`);
		}

		return await response.data;
	}
}