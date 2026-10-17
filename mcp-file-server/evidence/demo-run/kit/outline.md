# MCP Week 6: Outline

Source: projects/demo/source/notes.md

## 1. Why MCP
- The N x M problem: 3 apps x 3 services = 9 custom connectors. With MCP it is 3 + 3 = 6 pieces, each written once.
- MCP is an open standard introduced by Anthropic in Nov 2024. Messages are JSON-RPC 2.0.
- MCP is not a model and not an agent framework. It is a contract: servers promise what they offer, clients follow the schema.

## 2. Roles
- Host: the app the user talks to. Owns the LLM, the conversation and the permission prompts.
- Client: lives inside the host, holds exactly one connection to one server, speaks the protocol.
- Server: exposes tools, resources and prompts. Knows nothing about the LLM behind the host.

## 3. Primitives
- Tool: a model-controlled action the model can invoke (example: write_file).
- Resource: application-controlled, read-only context addressed by a URI.
- Prompt: a user-controlled reusable message template, often a slash command.

## 4. Lifecycle
- initialize (version, capabilities) -> result -> notifications/initialized -> tools/list -> tools/call -> result (content, isError).
- Every step is a JSON-RPC message.

## 5. Transports
- stdio: the server is a subprocess on the same machine and inherits the user account. Best for personal tools.
- Streamable HTTP: the server is a web service at a URL and needs its own auth (tokens, secret path, or OAuth). Best for shared servers and multi-agent work.

## 6. Designing good tools
- Name is a short verb_noun.
- Description says what the tool does, when to use it and how it fails.
- The input schema blocks bad calls.
- Results carry an isError flag so the agent can recover.

## 7. Orchestration
- Tool-use loop: plan, call, observe, decide. Set a stop condition and a maximum step count.
- Patterns: single agent with a toolbox, pipeline, orchestrator with workers, shared workspace (agents leave state in files and take turns).
