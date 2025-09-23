# Use an official Node.js runtime as a parent image
FROM node:24

# Set the working directory in the container to /app
WORKDIR /app

# Clone your repo
RUN git clone https://github.com/DefiLlama/api-status.git /app

# Change to the directory of your repo
WORKDIR /app

RUN npm i

# Make port 5001 available to the world outside this container
EXPOSE 5001

# bash command to keep the container running
CMD ["npm", "run", "start"]