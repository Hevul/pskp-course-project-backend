import jwt from "jsonwebtoken";
import User from "../../../core/src/entities/User";
import { LOGIN, PASSWORD, SECRET_KEY, USER_ID } from "../utils/constants";
import { JwtProvider } from "../utils/imports";

describe("JwtProvider service", () => {
  let jwtProvider: JwtProvider;
  let user: User;

  beforeEach(() => {
    jwtProvider = new JwtProvider(SECRET_KEY);
    user = new User(LOGIN, PASSWORD, USER_ID);
  });

  it(`returns valid jwt token`, () => {
    const token = jwtProvider.generate(user);

    const decoded = jwt.verify(token, SECRET_KEY) as { id: string };

    expect(token).toBeDefined();
    expect(decoded.id).toBe(user.id);
  });

  it(`verifies jwt token 
      when token is valid`, () => {
    const token = jwtProvider.generate(user);

    const payload = jwtProvider.verify(token);

    expect(payload).toBeDefined();
    expect(payload?.id).toBe(user.id);
  });

  it(`returns undefined 
      when token is invalid`, () => {
    const token = "invalid-token";
    const payload = jwtProvider.verify(token);

    expect(payload).toBeUndefined();
  });

  it(`returns undefined 
      when jwt provider changes secret key`, () => {
    // ASSIGN
    const oldJwtProvider = new JwtProvider("old-secret-key");

    // ACT
    const token = oldJwtProvider.generate(user);

    const newJwtProvider = new JwtProvider("new-secret-key");

    const payload = newJwtProvider.verify(token);

    // ASSERT
    expect(payload).toBeUndefined();
  });
});
