import { RoutesType, RoutesTypeWS } from './types';
import User from './User';

const modules = [
  User,
];

const crud: RoutesType[] = modules.flatMap((e) => e.crud);
const websockets: RoutesTypeWS[] = modules.flatMap((e) => e.websockets);

export default {
  crud,
  websockets,
};