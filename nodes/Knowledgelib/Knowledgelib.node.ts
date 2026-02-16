import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class Knowledgelib implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Knowledgelib',
		name: 'knowledgelib',
		icon: 'file:knowledgelib.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Query pre-verified, cited knowledge units from knowledgelib.io',
		defaults: {
			name: 'Knowledgelib',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'knowledgelibApi',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Query Knowledge',
						value: 'query',
						description: 'Search across all knowledge units by relevance',
						action: 'Search knowledge units',
					},
					{
						name: 'Get Unit',
						value: 'getUnit',
						description: 'Retrieve a specific knowledge unit by ID',
						action: 'Get a knowledge unit',
					},
					{
						name: 'List Domains',
						value: 'listDomains',
						description: 'List all available knowledge domains and unit counts',
						action: 'List all domains',
					},
				],
				default: 'query',
			},
			// --- Query operation ---
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['query'] } },
				description: 'Search query (e.g., "best wireless earbuds under 150")',
				placeholder: 'best wireless earbuds under 150',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: { minValue: 1, maxValue: 20 },
				displayOptions: { show: { operation: ['query'] } },
				description: 'Max number of results to return',
			},
			{
				displayName: 'Domain Filter',
				name: 'domain',
				type: 'string',
				default: '',
				displayOptions: { show: { operation: ['query'] } },
				description:
					'Filter by domain (e.g., "consumer_electronics", "computing", "home", "fitness")',
			},
			{
				displayName: 'Fetch Full Content',
				name: 'fetchFullContent',
				type: 'boolean',
				default: false,
				displayOptions: { show: { operation: ['query'] } },
				description:
					'Whether to fetch the full markdown content of each matching unit (increases response size)',
			},
			// --- Get Unit operation ---
			{
				displayName: 'Unit ID',
				name: 'unitId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: { show: { operation: ['getUnit'] } },
				description:
					'Unit ID path (e.g., "consumer-electronics/audio/wireless-earbuds-under-150/2026")',
				placeholder:
					'consumer-electronics/audio/wireless-earbuds-under-150/2026',
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'Markdown', value: 'md' },
					{ name: 'JSON', value: 'json' },
				],
				default: 'md',
				displayOptions: { show: { operation: ['getUnit'] } },
				description:
					'Response format: raw markdown or structured JSON with parsed frontmatter',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		// Resolve API base URL and optional key
		let apiUrl = 'https://knowledgelib.io';
		let apiKey = '';
		try {
			const creds = await this.getCredentials('knowledgelibApi');
			if (creds) {
				apiUrl = (creds.apiUrl as string) || apiUrl;
				apiKey = (creds.apiKey as string) || '';
			}
		} catch {
			// Credentials not configured — use public defaults
		}

		const headers: Record<string, string> = {};
		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`;
		}

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'query') {
					const query = this.getNodeParameter('query', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;
					const domain = this.getNodeParameter('domain', i) as string;
					const fetchFull = this.getNodeParameter(
						'fetchFullContent',
						i,
					) as boolean;

					const qs: Record<string, string | number> = {
						q: query,
						limit,
					};
					if (domain) qs.domain = domain;

					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${apiUrl}/api/v1/query`,
						qs,
						headers: { ...headers, Accept: 'application/json' },
						json: true,
					});

					// Optionally fetch full markdown for each result
					if (fetchFull && response.results) {
						for (const result of response.results) {
							try {
								const md = await this.helpers.httpRequest({
									method: 'GET',
									url: `${apiUrl}/api/v1/units/${result.id}.md`,
									headers: {
										...headers,
										Accept: 'text/markdown',
									},
									json: false,
									encoding: 'text',
								});
								result.full_content = md;
							} catch {
								result.full_content = null;
							}
						}
					}

					returnData.push({ json: response });
				} else if (operation === 'getUnit') {
					const unitId = this.getNodeParameter('unitId', i) as string;
					const format = this.getNodeParameter('format', i) as string;

					if (format === 'json') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiUrl}/api/v1/units/${unitId}.json`,
							headers: {
								...headers,
								Accept: 'application/json',
							},
							json: true,
						});
						returnData.push({ json: response });
					} else {
						const content = await this.helpers.httpRequest({
							method: 'GET',
							url: `${apiUrl}/api/v1/units/${unitId}.md`,
							headers: { ...headers, Accept: 'text/markdown' },
							json: false,
							encoding: 'text',
						});
						returnData.push({
							json: { id: unitId, format: 'markdown', content },
						});
					}
				} else if (operation === 'listDomains') {
					const response = await this.helpers.httpRequest({
						method: 'GET',
						url: `${apiUrl}/catalog.json`,
						headers: { ...headers, Accept: 'application/json' },
						json: true,
					});

					returnData.push({
						json: {
							total_units: response.total_units,
							domains: response.domains,
						},
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
