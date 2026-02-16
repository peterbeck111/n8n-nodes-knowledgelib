import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';
export declare class KnowledgelibApi implements ICredentialType {
    name: string;
    displayName: string;
    documentationUrl: string;
    icon: {
        readonly light: "file:../nodes/Knowledgelib/knowledgelib.svg";
        readonly dark: "file:../nodes/Knowledgelib/knowledgelib.svg";
    };
    properties: INodeProperties[];
    test: ICredentialTestRequest;
}
