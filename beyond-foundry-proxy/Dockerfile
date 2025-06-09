# Dockerfile for Beyond Foundry Proxy
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build && npm prune --production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "dist/index.js"]
