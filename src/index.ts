import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { spawn } from "child_process";
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { loadMcpTools } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function spawnLocal(cmd: string, args: string[]) {
  const transport = new StdioClientTransport({ command: cmd, args: args });
  const c = new Client({ name: cmd, version: "0.0.1" });
  await c.connect(transport);
  return c;
}

export async function createDiningAgent() {
  const eaterPath = process.env.EATER_SERVER_PATH || "/Users/pmv/gitWorkspace/eater_mcp/dist/index.js";
  const resyPath = process.env.RESY_SERVER_PATH || "/Users/pmv/gitWorkspace/resy_mcp/dist/index.js";

  const eaterClient = await spawnLocal("node", [eaterPath]);
  const resyClient = await spawnLocal("node", [resyPath]);

  const eaterTools = await loadMcpTools("eater", eaterClient);
  const resyTools = await loadMcpTools("resy", resyClient);
  const tools = [...eaterTools, ...resyTools];

  const SYSTEM = `
You are an NYC dining concierge.

Guidelines:
• If the user asks only "Does Restaurant X have a table …" call *resy_search* once and return the result.

• If the user asks for "new/hot/ramen restaurants that ARE available at a given date or time":
    1. if time is not specified, ask for it, otherwise use the given time
    2. call *eater_search* with associted keyword (i.e. new/hot/ramen)
    3. loop over candidates with *resy_search*
    4. answer with the first 3 that have at least one slot.

• Example flows:
    - Case A: When asked for recommendations about burger places, call *eater_search* with keyword "burger".
    - Case B: If asked to find a ramen place with a table for 4 on a date, first confirm the time. Then call *eater_search* with "ramen"; use *resy_search* with the returned list, table size, date and time, and report the availability.
    - Case C: If asked to confirm a specific restaurant's table at a given time and date, call *resy_search* with restaurant name, size, date and time and return that answer.

Return concise bullet points with restaurant name and availability.`;

  const agent = createReactAgent({
    llm: new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-preview-04-17",
      temperature: 0,
      apiKey: process.env.GOOGLE_API_KEY,
    }),
    tools,
    systemPrompt: SYSTEM,
  });

  return agent;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const agent = await createDiningAgent();
    process.stdout.write("Ready for chat. Type your message and press Enter.\nType 'exit' to quit.\n");
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    rl.on("line", async (input: string) => {
      if (input.trim().toLowerCase() === "exit") {
        rl.close();
        return;
      }
      const answer = await agent.invoke([{ role: "user", content: input }]);
      console.log(answer.content);
    });
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
