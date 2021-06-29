import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { getRepository } from "typeorm";
import * as jwt from "jsonwebtoken";
import { User } from "../entities/User";
import * as config from "../config.json";
interface JwtPayload {
  userId: number,
  email: string,
}

export function checkLogin(passthrough?: boolean) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const token = <string>req.headers['authorization'];

    try {
      const jwtPayload = <JwtPayload>jwt.verify(token, config.secret || process.env.JWT_SECRET || "SECRET");
      res.locals.jwtPayload = jwtPayload;

      const { userId } = jwtPayload;
      const user = await getRepository(User).findOneOrFail(userId);
      res.locals.user = user;
      const newToken = user.getJWTToken();
      res.setHeader('authorization', newToken);
      return next();
    } catch (e) {
      console.log(e);
      if (passthrough) {
        res.locals.user = undefined;
        return next();
      } else {
        return res.status(StatusCodes.UNAUTHORIZED).send(`JWT is not correct or user was not found`);
      }
    }
  }
}
