# MCP Week 6: Glossary

Source: projects/demo/source/notes.md. Exactly 12 terms.

1. **host**: The app the user talks to. It owns the LLM, the conversation and the permission prompts.
2. **client**: Lives inside the host, holds exactly one connection to one server, and speaks the protocol.
3. **server**: Exposes tools, resources and prompts. It knows nothing about the LLM behind the host.
4. **tool**: A model-controlled action the model can invoke (example: write_file).
5. **resource**: Application-controlled, read-only context addressed by a URI.
6. **prompt**: A user-controlled reusable message template, often a slash command.
7. **JSON-RPC**: The message format MCP uses (JSON-RPC 2.0).
8. **stdio**: Transport where the server is a subprocess on the same machine and inherits the user account. Best for personal tools.
9. **Streamable HTTP**: Transport where the server is a web service at a URL and needs its own auth (tokens, secret path, or OAuth). Best for shared servers and multi-agent work.
10. **isError**: A flag in tool results so the agent can recover from a failure.
11. **N x M problem**: Without MCP, N apps x M services need N x M custom connectors (3 x 3 = 9). With MCP it is N + M pieces (3 + 3 = 6), each written once.
12. **shared workspace**: An orchestration pattern where agents leave state in files and take turns.
