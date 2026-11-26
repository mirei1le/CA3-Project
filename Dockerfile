FROM node:24-alpine

WORKDIR /app

# Install dependencies first so Docker can cache this layer
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application code
COPY . .

EXPOSE 3000
CMD ["node", "src/app.js"]
