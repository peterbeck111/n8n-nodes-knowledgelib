"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgelibApi = void 0;
class KnowledgelibApi {
    constructor() {
        this.name = 'knowledgelibApi';
        this.displayName = 'Knowledgelib API';
        this.documentationUrl = 'https://knowledgelib.io/api';
        this.icon = { light: 'file:../nodes/Knowledgelib/knowledgelib.svg', dark: 'file:../nodes/Knowledgelib/knowledgelib.svg' };
        this.properties = [
            {
                displayName: 'API URL',
                name: 'apiUrl',
                type: 'string',
                default: 'https://knowledgelib.io',
                description: 'Base URL for the knowledgelib.io API. Change only for self-hosted instances.',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                description: 'Optional API key. Not required for the free public API.',
            },
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials.apiUrl}}',
                url: '/catalog.json',
                method: 'GET',
            },
        };
    }
}
exports.KnowledgelibApi = KnowledgelibApi;
