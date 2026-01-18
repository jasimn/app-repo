# node:18-alpine is base image 
FROM node:18-alpine
# creating working inside container
WORKDIR /app
# copy  packages inside the docker's working direcotry 
COPY package*.json ./
# installing dependencies
RUN npm install  --production
# copy  souce code into the container.
COPY . .
# exposing backened port 
EXPOSE 3000
# starting the server
CMD [ "node", "index.js" ]
