FROM node:lts

RUN mkdir /code
WORKDIR /code

COPY orion.tgz ./
COPY config-* ./
COPY server.js ./
COPY package.json ./
COPY node_modules ./node_modules

RUN ls

CMD ["npm", "start"]
