# Verified Source Notes

## Google Play Release Gates

Google Play states that, from **31 August 2026**, new Android apps and updates must target Android 16, API level 36 or later. This project must treat that target as a release gate rather than assuming the Expo default configuration will remain compliant. Existing-app availability has a different threshold and does not replace the submission requirement. [1]

Google Play’s User Data policy requires transparent disclosure of access, collection, use, handling, and sharing of user data, limited to disclosed policy-compliant purposes. The policy expressly says that developers remain responsible for third-party code and third-party AI integrations, including disclosure, consent, and limited use of user data. [2]

## AI Tool-Calling Boundary

Gemini’s official function-calling documentation defines tool calling as a structured application-managed loop. The application supplies function declarations; the model proposes a call; the application validates and executes the requested function; and the result is sent back to the model for a user-facing response. The model does not execute external functions itself. This supports a design with a server-side tool registry, argument validation, risk policy checks, audit logging, and explicit approval boundaries. [3]

## Connected Apps and Automation Boundaries

MCP security guidance requires per-client consent before third-party authorization flows when proxying connected services. It also requires exact registered redirect-URI validation and strong, server-side validation of one-time OAuth state values. The app must therefore treat an MCP server as an external trust boundary, show the tools and permissions it requests, minimise scopes, and permit revocation. [4]

Android documents WorkManager as a reliable mechanism for work that needs to persist across app restarts and device reboots, such as periodic synchronization. Android also states that WorkManager is not a general solution for all immediate work. This supports an architecture in which the device schedules modest client synchronization while persistent, long-running agent workflows are run only on a verified server-side worker. [5]

## Open-Source Architecture References

LangChain is a large agent-engineering framework published under the MIT License. Its useful conceptual reference is an integration-oriented boundary between models, tools, documents, and application logic. This product will not embed the framework in the mobile client; instead it will adopt the original design principle of provider-independent interfaces and explicit tool contracts. [6]

The official MCP Python SDK implements standard MCP servers and clients using transports that include standard input/output, Streamable HTTP, and SSE, and it is MIT licensed. It is a reference for protocol and capability design only; a production mobile product should keep provider authentication and connected-service orchestration on the server side rather than shipping desktop-style transport assumptions to the Android client. [7]

## References

[1]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en "Target API level requirements for Google Play apps"
[2]: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en "User Data — Play Console Help"
[3]: https://ai.google.dev/gemini-api/docs/function-calling "Function calling with the Gemini API"
[4]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "MCP Security Best Practices"
[5]: https://developer.android.com/develop/background-work/background-tasks/persistent "Android Task Scheduling"
[6]: https://github.com/langchain-ai/langchain "LangChain Repository"
[7]: https://github.com/modelcontextprotocol/python-sdk "Official MCP Python SDK"
