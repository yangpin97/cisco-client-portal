FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

RUN mkdir -p /app/uploads && chmod 777 /app/uploads
RUN mkdir -p /app/data && chmod 777 /app/data

RUN if [ ! -f /app/data.json ]; then \
    cp /app/public/img/ios-qr.png /app/public/img/android-qr.png /app/data/ 2>/dev/null; \
  fi

EXPOSE 9907

CMD ["node", "server.js"]
