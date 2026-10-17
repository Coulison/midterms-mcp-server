# MCP Week 6: Quiz

Source: projects/demo2/source/notes.md

1. Without MCP, how many custom connectors do 3 apps and 3 services need, and how many pieces does MCP reduce this to? (Term: N x M problem)
Answer: 9 custom connectors (3 x 3). With MCP it is 3 + 3 = 6 pieces, each written once.

2. Which message format does MCP use? (Term: JSON-RPC)
Answer: JSON-RPC 2.0.

3. Which role owns the LLM, the conversation and the permission prompts? (Term: host)
Answer: The host, the app the user talks to.

4. How many servers does one client hold a connection to? (Terms: client, server)
Answer: Exactly one. The client lives inside the host and holds one connection to one server.

5. Which primitive is model-controlled, and which is application-controlled and read-only? (Terms: tool, resource)
Answer: Tools are model-controlled actions (example: write_file). Resources are application-controlled, read-only context addressed by a URI.

6. Who controls a prompt, and what is it often used as? (Term: prompt)
Answer: The user controls it. It is a reusable message template, often a slash command.

7. Which transport runs the server as a subprocess on the same machine, and which one needs its own auth? (Terms: stdio, Streamable HTTP)
Answer: stdio runs the server as a local subprocess that inherits the user account. Streamable HTTP is a web service at a URL and needs its own auth (tokens, secret path, or OAuth).

8. What is the purpose of the isError flag in a tool result, and which orchestration pattern has agents leave state in files and take turns? (Terms: isError, shared workspace)
Answer: isError lets the agent recover from a failure. The pattern is the shared workspace.
