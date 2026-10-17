# Source notes: MCP Week 6 (the only source agents may use)

## Why MCP
- Without MCP, 3 apps x 3 services = 9 custom connectors (N x M). With MCP, 3 + 3 = 6 pieces (N + M), each written once.
- MCP is an open standard introduced by Anthropic in Nov 2024. Messages are JSON-RPC 2.0.
- MCP is not a model and not an agent framework. It is a contract: servers promise what they offer, clients follow the schema.

## Roles
- Host: the app the user talks to. Owns the LLM, the conversation and the permission prompts.
- Client: lives inside the host, holds exactly one connection to one server, speaks the protocol.
- Server: exposes tools, resources and prompts. Knows nothing about the LLM behind the host.

## Primitives
- Tools: model-controlled actions the model can invoke (example: write_file).
- Resources: application-controlled, read-only context addressed by a URI.
- Prompts: user-controlled reusable message templates, often slash commands.

## Lifecycle
- initialize (version, capabilities) -> result -> notifications/initialized -> tools/list -> tools/call -> result (content, isError).

## Transports
- stdio: server is a subprocess on the same machine; inherits the user account; best for personal tools.
- Streamable HTTP: server is a web service at a URL; needs its own auth (tokens, secret path, or OAuth); best for shared servers and multi-agent work.

## Good tools
- Name is a short verb_noun. Description says what it does, when to use it and how it fails. Input schema blocks bad calls. Results carry an isError flag so the agent can recover.

## Orchestration
- Tool-use loop: plan, call, observe, decide. Set a stop condition and a maximum step count.
- Patterns: single agent with a toolbox, pipeline, orchestrator with workers, shared workspace (agents leave state in files and take turns).