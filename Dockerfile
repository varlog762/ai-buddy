FROM node:lts-alpine

WORKDIR /app

EXPOSE 8080

COPY package* ./

# ENV NODE_ENV=development

RUN npm install

COPY . ./

CMD [ "npm", "run", "dev" ]

# Create image: docker build . -t crypto-dude:latest

# Create container: docker run -it  --rm -v /Users/greg/Projects/node/cryptodude/src:/app/src -p 8080:8080 crypto-dude:latest