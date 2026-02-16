import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class KnowledgelibApi implements ICredentialType {
	name = 'knowledgelibApi';
	displayName = 'Knowledgelib API';
	documentationUrl = 'https://knowledgelib.io/api';
	icon = { light: 'file:../nodes/Knowledgelib/knowledgelib.svg', dark: 'file:../nodes/Knowledgelib/knowledgelib.svg' } as const;
	properties: INodeProperties[] = [
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

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.apiUrl}}',
			url: '/catalog.json',
			method: 'GET',
		},
	};
}
