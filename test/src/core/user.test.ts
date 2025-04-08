import LineTooLongError from "../../../core/src/errors/LineTooLongError";
import LineTooShortError from "../../../core/src/errors/LineTooShortError";
import { PASSWORD, LOGIN, USER_ID } from "../utils/constants";
import { User } from "../utils/imports";

describe("User", () => {
  it(`create user`, () => {
    const user = new User(LOGIN, PASSWORD, USER_ID);

    expect(user).toEqual({ id: USER_ID, login: LOGIN, password: PASSWORD });
  });

  it(`throws LineTooLongError
      when login is too long`, () => {
    const tooLongLogin = "".padEnd(129, "a");

    expect(() => new User(tooLongLogin, PASSWORD, USER_ID)).toThrow(
      LineTooLongError
    );
  });

  it(`throws LineTooLongError
      when login is too short`, () => {
    const tooShortLogin = "";

    expect(() => new User(tooShortLogin, PASSWORD, USER_ID)).toThrow(
      LineTooShortError
    );
  });
});
