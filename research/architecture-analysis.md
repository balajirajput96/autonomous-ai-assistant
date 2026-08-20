# Architecture Analysis

## Research Method

This review prioritises specifications, official documentation, and official repositories. The projects below are architecture references, not code sources. Reuse requires a licence-specific review; the product will implement its own mobile and server code.

| Project | URL | Licence | Useful Architecture Idea | Limitation and Product Decision |
| --- | --- | --- | --- | --- |
| Gemini function calling | [Official documentation][1] | Service documentation | Application-managed tool loop with declarations, execution, result, and final response. | The model proposes calls but does not execute them; server policy remains mandatory. |
| LangChain | [Official repository][2] | MIT | Separate model, tools, documents, and integration boundaries. | Avoid embedding a complex desktop/server framework in the mobile client; adopt only the interface principle. |
| MCP Python SDK | [Official repository][3] | MIT | Standard client/server protocol concepts and portable transports. | Keep authentication, token storage, and orchestration server-side; mobile must not assume stdio or trusted servers. |
| WorkManager | [Android documentation][4] | Android platform documentation | Reliable deferrable work that can survive restarts. | Not a substitute for immediate or indefinitely running autonomous agents. |

## Resulting Design Pattern

The product uses a provider adapter and a policy-governed tool gateway behind a mobile client. It adopts neither a framework-specific agent format nor a client-held connector secret. A task record forms the stable contract between layers so that new providers, retrieval, files, or connectors can be added without forcing a redesign of the conversation interface.

## References

[1]: https://ai.google.dev/gemini-api/docs/function-calling "Function calling with the Gemini API"
[2]: https://github.com/langchain-ai/langchain "LangChain"
[3]: https://github.com/modelcontextprotocol/python-sdk "Official MCP Python SDK"
[4]: https://developer.android.com/develop/background-work/background-tasks/persistent "Android Task Scheduling"
