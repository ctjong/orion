FROM node:lts

RUN mkdir /code
WORKDIR /code

COPY orion.tgz ./
COPY *.js ./
COPY package.json ./

RUN npm install
RUN ls

CMD ["npm", "start"]
