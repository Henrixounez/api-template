import { NextFunction, Request, Response } from "express";
import { getRepository } from "typeorm";
import { StatusCodes } from 'http-status-codes';
import { User, formatUserReturn, UserReturn } from '../../entities/User';

export interface LoginReturn extends UserReturn {
  token: string;
}

// POST
// Login user
export async function login(req: Request, res: Response<LoginReturn | string>): Promise<Response<LoginReturn | string>> {
  const userRepository = getRepository(User);
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(StatusCodes.BAD_REQUEST).send("Bad Request");

  const user = await userRepository.findOne({ where: { email: email }});
  if (!user)
    return res.status(StatusCodes.UNAUTHORIZED).send("Wrong email or password");
  if (!user.checkPassword(password))
    return res.status(StatusCodes.UNAUTHORIZED).send("Wrong email or password");

  const token = user.getJWTToken();
  res.setHeader('authorization', token);
  return res.status(StatusCodes.OK).json({
    token: token,
    ...formatUserReturn(user)
  });
}

// POST
// Register user
export async function register(req: Request, res: Response<LoginReturn | string>): Promise<Response<LoginReturn | string>> {
  const userRepository = getRepository(User);
  const { email, password, firstname, lastname } = req.body;

  if (!email || !password || !firstname || !lastname)
    return res.status(StatusCodes.BAD_REQUEST).send("Bad Request");

  const checkUser = await userRepository.findOne({ email: email });
  if (checkUser)
    return res.status(StatusCodes.CONFLICT).send("Email already used");

  const user = await userRepository.save(
    userRepository.create({
      email,
      password,
      firstname,
      lastname
    })
  );
  const token = user.getJWTToken();
  res.setHeader('authorization', token);
  return res.status(StatusCodes.CREATED).json({
    token,
    ...formatUserReturn(user)
  })
}

// GET
// Return all users
// Should be Admin Only
export async function getAllUsers(req: Request, res: Response<Array<UserReturn>>): Promise<void> {
  const userRepository = getRepository(User);

  const users = await userRepository.find();
  res.status(StatusCodes.OK).json(users.map((user) => formatUserReturn(user)));
}

// GET
// Returns user
export async function get(req: Request, res: Response<UserReturn | string>): Promise<Response<UserReturn | string>> {
  const userRepository = getRepository(User);
  const userId = res.locals.user.id;

  const user = await userRepository.findOne(userId);
  if (!user)
    return res.status(StatusCodes.NOT_FOUND).send('User not found');
  return res.status(StatusCodes.OK).json(formatUserReturn(user));
}

// PUT
// Updates asked user
export async function update(req: Request, res: Response<UserReturn | string>): Promise<Response<UserReturn | string>> {
  const userRepository = getRepository(User);
  const { email, password, firstname, lastname, type } = req.body;
  const userId = res.locals.user.id;

  const user = await userRepository.findOne(userId);
  if (!user)
    return res.status(StatusCodes.NOT_FOUND).send('User not found');

  user.email = email !== undefined ? email : user.email,
  user.password = password !== undefined ? password : user.password,
  user.firstname = firstname !== undefined ? firstname : user.firstname,
  user.lastname = lastname !== undefined ? lastname : user.lastname,
  await userRepository.save(user);

  return res.status(StatusCodes.OK).json(formatUserReturn(user));
}

// DELETE
// Remove asked user
export async function del(req: Request, res: Response<UserReturn | string>): Promise<Response<UserReturn | string>> {
  const userRepository = getRepository(User);
  const userId = res.locals.user.id;

  const user = await userRepository.findOne(userId);
  if (!user)
    return res.status(StatusCodes.NOT_FOUND).send('User not found');

  await userRepository.remove(user);
  return res.sendStatus(StatusCodes.OK).json(formatUserReturn(user));
}