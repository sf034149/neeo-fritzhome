FROM  neeo/node-sdk

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install --verbose

# Bundle app source
COPY . .

EXPOSE 6336

CMD ["/usr/src/app/start_up.sh", "/usr/src/app/index.js"]
