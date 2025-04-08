import CanNotBeEmptyError from "../errors/CanNotBeEmptyError";
import LineTooLongError from "../errors/LineTooLongError";
import LineTooShortError from "../errors/LineTooShortError";

class User {
  constructor(
    public login: string,
    public password: string,
    public id: string = ""
  ) {
    this.validateLogin(login);
    this.validatePassword(password);
  }

  private validateLogin(str: string) {
    if (str.length > 128) throw new LineTooLongError();
    if (str.length < 6) throw new LineTooShortError();
    if (!str) throw new CanNotBeEmptyError();
  }

  private validatePassword(str: string) {
    if (str.length > 128) throw new LineTooLongError();
    if (str.length < 6) throw new LineTooShortError();
    if (!str) throw new CanNotBeEmptyError();
  }
}

export default User;
