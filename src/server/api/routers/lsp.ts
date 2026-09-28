import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { LSP_SERVER_IDS } from "~/lib/lsp/servers";
import { signLspToken } from "~/lib/lsp/token";

export const lspRouter = createTRPCRouter({
    /**
     * Where and how to connect to the LSP gateway for one language server.
     * Returns null when the gateway isn't configured or the user isn't
     * signed in; the editor then runs with syntax highlighting only.
     *
     * A mutation because every call mints a new short-lived token.
     */
    getSession: publicProcedure
        .input(z.object({ server: z.enum(LSP_SERVER_IDS) }))
        .mutation(async ({ ctx, input }) => {
            if (!env.LSP_GATEWAY_URL || !env.LSP_GATEWAY_SECRET) return null;

            // Signed out: quietly no LSP (the editor still works).
            if (!ctx.session) return null;

            const base = env.LSP_GATEWAY_URL.replace(/\/+$/, "");
            return {
                url: `${base}/lsp/${input.server}`,
                token: signLspToken(
                    { sub: ctx.session.user.id, srv: input.server },
                    env.LSP_GATEWAY_SECRET,
                ),
            };
        }),
});
