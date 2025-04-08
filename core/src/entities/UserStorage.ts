import CanNotBeEmptyError from "../errors/CanNotBeEmptyError";
import LineTooLongError from "../errors/LineTooLongError";

class UserStorage {
  private _name: string;

  constructor(name: string, public ownerId: string, public id: string = "") {
    this.validateName(name);
    this._name = name;
  }

  public get name(): string {
    return this._name;
  }

  public set name(newName: string) {
    this.validateName(newName);
    this._name = newName;
  }

  private validateName(name: string) {
    if (!name) throw new CanNotBeEmptyError();
    if (name.length > 128) throw new LineTooLongError();
  }
}

export default UserStorage;
