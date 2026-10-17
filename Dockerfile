FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --chown=node:node api ./api
COPY --chown=node:node dist ./dist
COPY --chown=node:node scripts/evaluate-agents.mjs ./scripts/evaluate-agents.mjs
COPY --chown=node:node scripts/quality-benchmark.mjs ./scripts/quality-benchmark.mjs
COPY --chown=node:node scripts/commentary-comparison.mjs ./scripts/commentary-comparison.mjs
RUN mkdir -p docs/proof && chown -R node:node docs
USER node
EXPOSE 8080
CMD ["node", "api/server.mjs"]
COPY --chown=node:node scripts/heldout-commentary.mjs ./scripts/heldout-commentary.mjs
