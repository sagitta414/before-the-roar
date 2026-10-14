FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --chown=node:node api ./api
COPY --chown=node:node dist ./dist
USER node
EXPOSE 8080
CMD ["node", "api/server.mjs"]
