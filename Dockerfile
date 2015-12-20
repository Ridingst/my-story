FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . in /usr/src/app/
RUN npm install
COPY . in /usr/src/app
EXPOSE 8001/tcp
CMD ["node" "/usr/src/app/app.js"]