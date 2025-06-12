# Dockerfile for beyond-foundry-proxy
FROM --platform=linux/amd64 node:lts

# Install Puppeteer/Chromium dependencies
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production && npm install --only=dev

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port 4000
EXPOSE 4000


# Start the server
CMD ["npm", "start"]
