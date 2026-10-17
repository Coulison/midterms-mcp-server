# MCP Week 6: Quiz

Source: projects/demo/source/notes.md. Exactly 8 questions.

1. In the N x M problem, how many custom connectors do 3 apps and 3 services need without MCP, and how many pieces with MCP?
Answer: 9 custom connectors (3 x 3) without MCP; 6 pieces (3 + 3), each written once, with MCP.

2. Which message format does MCP use?
Answer: JSON-RPC 2.0.

3. Which role owns the LLM, the conversation and the permission prompts: the host, the client or the server?
Answer: The host.

4. How many servers does one client hold a connection to?
Answer: Exactly one. The client lives inside the host and holds one connection to one server.

5. Which primitive is model-controlled: a tool, a resource or a prompt? Name the other two controllers.
Answer: The tool. Resources are application-controlled (read-only context addressed by a URI); prompts are user-controlled (reusable message templates, often slash commands).

6. Which transport suits a personal tool, and why: stdio or Streamable HTTP?
Answer: stdio. The server is a subprocess on the same machine and inherits the user account.

7. Why does a Streamable HTTP server need its own auth, and name one way to provide it.
Answer: It is a web service at a URL, so it must authenticate callers itself. Options are tokens, a secret path, or OAuth.

8. What is the isError flag for, and which orchestration pattern has agents leave state in files and take turns?
Answer: isError is a flag in tool results so the agent can recover from a failure. The pattern is the shared workspace.
