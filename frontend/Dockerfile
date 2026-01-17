# nginx is the base image
FROM nginx:alpine
# this creates default working directory in container
WORKDIR /app
# copy html,css,js file from host to container.
COPY . /usr/share/nginx/html
# expose port 80 for http traffic.
EXPOSE  80
