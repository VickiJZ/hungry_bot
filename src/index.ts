import { spawn } from "child_process";
import { Client, StdioClientTransport } from "@modelcontextprotocol/sdk/client/index.js";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function spawnLocal(cmd: string, args: string[]) {
  const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"] });
  const transport = new StdioClientTransport(proc.stdin!, proc.stdout!);
  const c = new Client({ name: cmd });
  await c.connect(transport);
  return c;
}

export async function createDiningAgent() {
  const eaterPath = process.env.EATER_SERVER_PATH || "dist/eater-server.js";
  const resyPath = process.env.RESY_SERVER_PATH || "dist/resy-server.js";

  const eaterClient = await spawnLocal("node", [eaterPath]);
  const resyClient = await spawnLocal("node", [resyPath]);

  const eaterTools = await loadMcpTools("eater", eaterClient);
  const resyTools = await loadMcpTools("resy", resyClient);
  const tools = [...eaterTools, ...resyTools];

  const SYSTEM = `
You are an NYC dining concierge.

Guidelines:
• If the user asks only "Does Restaurant X have a table …" call *check_resy_availability* once and return the result.

• If the user asks for "new/hot restaurants that ARE available …":
    1. call *search_new_restaurants*
    2. loop over candidates with *check_resy_availability*
    3. answer with the first 3 that have at least one slot.

• Example flows:
    - Case A: When asked for recommendations about burger places, call *eater_search* with keyword "burger".
    - Case B: If asked to find a ramen place with a table for 4 on a date, first confirm the time. Then call *eater_search* with "ramen"; use *resy_search* with the returned list, table size, date and time, and report the availability.
    - Case C: If asked to confirm a specific restaurant's table at a given time and date, call *resy_search* with restaurant name, size, date and time and return that answer.

Return concise bullet points.`;

  const agent = createReactAgent({
    llm: new ChatGoogleGenerativeAI({ modelName: "gemini-2.5", temperature: 0 }),
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
