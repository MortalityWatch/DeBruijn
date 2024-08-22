FROM node:lts-alpine

RUN npm install -g http-server
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 80
CMD [ "http-server", "-p 80", "-c-1", "dist", "--proxy", "http://localhost:80?/" ]
