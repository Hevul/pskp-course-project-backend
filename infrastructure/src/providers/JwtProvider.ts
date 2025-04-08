import jwt from "jsonwebtoken";
import User from "../../../core/src/entities/User";
import JwtPayload from "../../../application/src/interfaces/JwtPayload";
import IJwtProvider from "../../../application/src/interfaces/IJwtProvider";

class JwtProvider implements IJwtProvider {
  constructor(private readonly _jwtSecret: string) {}

  generate(user: User): string {
    const payload = {
      id: user.id,
    };

    return jwt.sign(payload, this._jwtSecret);
  }

  verify(token: string): JwtPayload | undefined {
    try {
      const decoded = jwt.verify(token, this._jwtSecret) as { id: string };
      return { id: decoded.id };
    } catch (error) {
      return undefined;
    }
  }
}

export default JwtProvider;
