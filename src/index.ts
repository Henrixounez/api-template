import "reflect-metadata";
import * as express from "express";
import * as expressWs from "express-ws";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import * as dotenv from 'dotenv';
import { Request, Response, NextFunction } from "express";
import { Connection, createConnection } from "typeorm";

import * as config from "./config.json";
import routes from './routes';
import { StatusCodes } from "http-status-codes";

dotenv.config();

const appBase = express();
appBase.use(cors());
appBase.use(bodyParser.json());
const wsInstance = expressWs(appBase);
const { app } = wsInstance;

routes.crud.forEach((route) => {
  app[route.method](
    route.route,
    ...(route.middlewares || []),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await route.controller(req, res, next);
      } catch (e) {
        console.error(e);
        return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
  )
});

routes.websockets.forEach((route) => {
  app.ws(
    route.route,
    route.controller,
  )
});

export let typeormConnection: Connection;

createConnection({
  "type": "postgres",
  //"url": config.connectionString, // When commented, default to localhost
  "synchronize": true,
  "logging": false,
  "username": "postgres",
  "database": "template", // TODO: Change
  // "ssl": true,
  // "extra": {
  //   "ssl": {
  //     "rejectUnauthorized": false
  //   }
  // },
  "entities": [`${__dirname}/entities/**/*`],
  "subscribers": [`${__dirname}/entities/**/*`]
}).then(() => {
  app.listen(process.env.PORT || 8080, () => {
    setInterval(() => {
      wsInstance.getWss().clients.forEach((c) => {
        if (c.readyState === c.OPEN)
          c.ping();
      });
    }, 10000);
    
    console.log(`[API] Listening to ${process.env.PORT || 8080}`);
  })
});
