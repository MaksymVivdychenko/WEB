FROM node:22-alpine

RUN apk add --no-cache tzdata
ENV TZ=Europe/Kyiv

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4200

CMD ["npm", "start", "--", "--host", "0.0.0.0"]
