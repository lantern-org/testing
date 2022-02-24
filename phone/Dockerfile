FROM node:17.1.0

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
# EXPOSE 3000
# npm start
ENTRYPOINT [ "node", "app.js" ]
