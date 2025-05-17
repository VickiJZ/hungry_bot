# hungry_bot

A chatbot that finds feasible restaurants using LangChain and MCP tools.

## Setup

1. Install dependencies (Node.js >= 18 required):
   ```bash
   npm install
   ```
2. Build the TypeScript sources:
   ```bash
   npm run build
   ```
3. Set environment variables pointing to your MCP servers:
   - `EATER_SERVER_PATH` – path to the eater server script (default `dist/eater-server.js`)
   - `RESY_SERVER_PATH`  – path to the resy server script (default `dist/resy-server.js`)
   - `GOOGLE_GEMINI_API_KEY` – API key for Gemini

4. Start the chatbot:
   ```bash
   npm start
   ```
   Type messages and receive replies. Enter `exit` to quit.

The bot orchestrates restaurant search using two MCP servers and answers via Google's Gemini 2.5 model.
