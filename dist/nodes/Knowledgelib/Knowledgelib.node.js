"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Knowledgelib = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class Knowledgelib {
    constructor() {
        this.description = {
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
                    description: 'Filter by domain (e.g., "consumer_electronics", "computing", "home", "fitness")',
                },
                {
                    displayName: 'Fetch Full Content',
                    name: 'fetchFullContent',
                    type: 'boolean',
                    default: false,
                    displayOptions: { show: { operation: ['query'] } },
                    description: 'Whether to fetch the full markdown content of each matching unit (increases response size)',
                },
                // --- Get Unit operation ---
                {
                    displayName: 'Unit ID',
                    name: 'unitId',
                    type: 'string',
                    default: '',
                    required: true,
                    displayOptions: { show: { operation: ['getUnit'] } },
                    description: 'Unit ID path (e.g., "consumer-electronics/audio/wireless-earbuds-under-150/2026")',
                    placeholder: 'consumer-electronics/audio/wireless-earbuds-under-150/2026',
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
                    description: 'Response format: raw markdown or structured JSON with parsed frontmatter',
                },
            ],
            usableAsTool: true,
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        // Resolve API base URL and optional key
        let apiUrl = 'https://knowledgelib.io';
        let apiKey = '';
        try {
            const creds = await this.getCredentials('knowledgelibApi');
            if (creds) {
                apiUrl = creds.apiUrl || apiUrl;
                apiKey = creds.apiKey || '';
            }
        }
        catch {
            // Credentials not configured — use public defaults
        }
        const headers = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        for (let i = 0; i < items.length; i++) {
            try {
                if (operation === 'query') {
                    const query = this.getNodeParameter('query', i);
                    const limit = this.getNodeParameter('limit', i);
                    const domain = this.getNodeParameter('domain', i);
                    const fetchFull = this.getNodeParameter('fetchFullContent', i);
                    const qs = {
                        q: query,
                        limit,
                    };
                    if (domain)
                        qs.domain = domain;
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
                            }
                            catch {
                                result.full_content = null;
                            }
                        }
                    }
                    returnData.push({ json: response });
                }
                else if (operation === 'getUnit') {
                    const unitId = this.getNodeParameter('unitId', i);
                    const format = this.getNodeParameter('format', i);
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
                    }
                    else {
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
                }
                else if (operation === 'listDomains') {
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
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                    itemIndex: i,
                });
            }
        }
        return [returnData];
    }
}
exports.Knowledgelib = Knowledgelib;
