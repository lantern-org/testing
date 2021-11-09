FROM node

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
# npm start
ENTRYPOINT [ "node", "app.js" ]