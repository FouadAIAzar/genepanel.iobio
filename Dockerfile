FROM node:8.5

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .
EXPOSE 4024
CMD [ "npm", "start" ]