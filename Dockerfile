FROM node:lts AS build

WORKDIR /app
COPY . .
RUN rm -rf node_modules && npm i
RUN npm run build

FROM node:lts-alpine

WORKDIR /app
RUN npm install -g http-server
COPY --from=build /app/dist ./dist
EXPOSE 80
CMD [ "http-server", "-p", "80", "-c-1", "dist", "--proxy", "http://localhost:80?/" ]
