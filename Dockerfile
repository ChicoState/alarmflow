FROM node:20-alpine

# Set working directory
WORKDIR /app

# --- NEW: Install Bash and Git manually ---
# This fixes the "env: can't execute bash" error
RUN apk add --no-cache bash git openssh
# ------------------------------------------

# Install global Expo CLI
RUN npm install -g expo-cli

# Copy package.json first
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--tunnel"]