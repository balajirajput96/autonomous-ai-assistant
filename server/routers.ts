import { COOKIE_NAME } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const assistantInput = z.object({
  prompt: z.string().trim().min(1, "Enter a request before sending.").max(4_000, "Requests are limited to 4,000 characters."),
  mode: z.enum(["ASSISTED", "AGENT"]),
});

const connectorProviderInput = z.object({
  providerId: z.enum(["github", "google-calendar", "gmail"]),
});

function oauthConfigurationState(providerId: z.infer<typeof connectorProviderInput>["providerId"]) {
  const configured =
    providerId === "github"
      ? Boolean(process.env.GITHUB_OAUTH_CLIENT_ID && process.env.GITHUB_OAUTH_CLIENT_SECRET && process.env.EXTERNAL_OAUTH_REDIRECT_URI)
      : Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET && process.env.EXTERNAL_OAUTH_REDIRECT_URI);

  return {
    providerId,
    state: configured ? "DISCONNECTED" : "CONFIGURATION_REQUIRED",
    canStartAuthorization: false,
    message: configured
      ? "OAuth credentials are present, but the production callback, state store, encrypted token persistence, and provider sandbox verification must be enabled before authorization can start."
      : "OAuth credentials and a fixed production HTTPS callback are not configured for this provider. No authorization page can be opened.",
  } as const;
}

function safeProviderError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("429") || message.includes("rate")) return "The assistant is temporarily rate-limited. Please try again shortly.";
  if (message.includes("401") || message.includes("403") || message.includes("credential") || message.includes("api_key")) return "The assistant provider is not available for this workspace.";
  if (message.includes("timeout") || message.includes("network") || message.includes("fetch")) return "The connection to the assistant provider was interrupted. Please try again.";
  return "The assistant could not complete this request. Your task record has been kept locally.";
}

async function chooseTextModel(): Promise<string | undefined> {
  const catalog = await listLLMModels();
  return catalog.data.find((model) => model.id === "gpt-5-mini")?.id ?? catalog.data[0]?.id;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  assistant: router({
    respond: publicProcedure.input(assistantInput).mutation(async ({ input }) => {
      try {
        const model = await chooseTextModel();
        if (!model) {
          throw new Error("No model is available for this workspace.");
        }

        const response = await invokeLLM({
          model,
          maxTokens: 700,
          messages: [
            {
              role: "system",
              content:
                "You are Autonomous, a careful mobile assistant. Answer the user's request directly and concisely. You can analyse, explain, draft, and plan, but do not claim to have performed external actions, sent messages, changed data, published content, accessed private accounts, or used tools. If a request would require an external, consequential, or sensitive action, explain the dependency and say that explicit approval is required.",
            },
            {
              role: "user",
              content: input.mode === "AGENT" ? `Plan this task carefully: ${input.prompt}` : input.prompt,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        const text = typeof content === "string" ? content.trim() : "";
        if (!text) {
          throw new Error("The provider returned an empty response.");
        }

        return {
          content: text,
          model: response.model || model,
          usage: response.usage
            ? { promptTokens: response.usage.prompt_tokens, completionTokens: response.usage.completion_tokens }
            : undefined,
        };
      } catch (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: safeProviderError(error), cause: error });
      }
    }),
  }),
  connectors: router({
    preflight: publicProcedure.input(connectorProviderInput).query(({ input }) => oauthConfigurationState(input.providerId)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
