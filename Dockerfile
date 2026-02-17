FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install global Expo CLI and other tools
RUN npm install -g expo-cli

# Copy package.json first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the ports Expo uses
# 8081: Metro Bundler
# 19000-19002: Expo legacy ports (if using older SDKs)
EXPOSE 8081 19000 19001 19002

# Start command
CMD ["npx", "expo", "start", "--tunnel"]