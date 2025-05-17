declare module "child_process" {
  export function spawn(cmd: string, args?: string[], options?: any): any;
}

declare const process: any;

declare module "readline" {
  export function createInterface(options: any): {
    on(event: string, listener: (...args: any[]) => void): void;
    close(): void;
  };
}

declare module "@modelcontextprotocol/sdk/client/index.js" {
  export class Client {
    constructor(config: any);
    connect(transport: any): Promise<void>;
  }
  export class StdioClientTransport {
    constructor(stdin: any, stdout: any);
  }
}

declare module "@langchain/mcp-adapters" {
  export function loadMcpTools(name: string, client: any): Promise<any[]>;
}

declare module "@langchain/langgraph/prebuilt" {
  export function createReactAgent(config: any): any;
}

declare module "@langchain/google-genai" {
  export class ChatGoogleGenerativeAI {
    constructor(options: any);
  }
}
