# Use an official Node.js runtime as a parent image
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

COPY prisma ./prisma
# Install app dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Expose port 3000 to the outside world
EXPOSE 3000

# Command to run your app
CMD [ "node", "src/server.js" ]