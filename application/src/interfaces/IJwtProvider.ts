import User from "../../../core/src/entities/User";
import JwtPayload from "./JwtPayload";

export default interface IJwtProvider {
  generate(user: User): string;
  verify(token: string): undefined | JwtPayload;
}
