FROM node:18-alpine

WORKDIR /app

RUN npm install @0xobelisk/sui-indexer@1.2.0-pre.20

COPY . .

RUN mkdir -p /app/.data && chmod 777 /app/.data

EXPOSE 3001

CMD ["npx", "sqlite-indexer", "--network", "testnet", "--sqlite-filename", "/app/.data/indexer.db", "--pagination-limit", "9999", "--rpc-url", "https://sui-testnet.blockvision.org/v1/2xV3AvaxiCU97FA9Cpjjlx5e2sW"]
