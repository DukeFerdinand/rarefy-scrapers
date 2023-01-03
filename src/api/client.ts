export class ApiClient {
	private readonly fetchOptions: RequestInit;
	private readonly baseUrl: string;

	constructor(baseUrl: string | undefined, fetchOptions: RequestInit) {
		if (!baseUrl) {
			throw new Error('baseUrl is required for ApiClient');
		}

		this.baseUrl = baseUrl;
		this.fetchOptions = fetchOptions;
	}

	// async get<T>(path: string): Promise<T> {
	// 	const response = await fetch(`${this.baseUrl}${path}`, this.fetchOptions);
	//
	// 	if (response.status !== 200) {
	// 		throw new Error(`Request failed with status code ${response.status}`);
	// 	}
	//
	// 	return await response.json();
	// }

	async post<D, T>(path: string, body: D): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			...this.fetchOptions,
			method: 'POST',
			body: JSON.stringify(body),
		});

		if (response.status !== 200) {
			throw new Error(`Request failed with status code ${response.status}`);
		}

		return await response.json();
	}
}