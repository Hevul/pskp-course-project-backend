import CannotAddSelfAsFriendError from "../errors/CannotAddSelfAsFriendError";
import DescriptionTooLongError from "../errors/DescriptionTooLongError";
import FriendAlreadyAddedError from "../errors/FriendAlreadyAddedError";
import NameTooLongError from "../errors/NameTooLongError";

interface FileLinkOptions {
  link: string;
  ownerId: string;
  fileInfoId: string;
  name?: string;
  description?: string;
  friends?: string[];
  isPublic?: boolean;
  createAt?: Date;
  downloadCount?: number;
  id?: string;
}

class FileLink {
  public id: string;
  private _name?: string;
  private _description?: string;
  public link: string;
  public ownerId: string;
  public fileInfoId: string;
  public friends: string[];
  public isPublic: boolean;
  public createAt: Date;
  public downloadCount: number;

  constructor(options: FileLinkOptions) {
    if (options.name) this.name = options.name;
    if (options.description) this.description = options.description;

    this.link = options.link;
    this.ownerId = options.ownerId;
    this.fileInfoId = options.fileInfoId;
    this.friends = options.friends ?? [];
    this.isPublic = options.isPublic ?? true;
    this.createAt = options.createAt ?? new Date();
    this.downloadCount = options.downloadCount ?? 0;
    this.id = options.id ?? "";
  }

  get name(): string | undefined {
    return this._name;
  }

  set name(value: string | undefined) {
    if (value === undefined) {
      this._name = undefined;
      return;
    }
    this._validateName(value);
    this._name = value;
  }

  get description(): string | undefined {
    return this._description;
  }

  set description(value: string | undefined) {
    if (value === undefined) {
      this._description = undefined;
      return;
    }
    this._validateDescription(value);
    this._description = value;
  }

  get isPrivate() {
    return !this.isPublic;
  }

  addFriend(id: string) {
    if (id === this.ownerId) throw new CannotAddSelfAsFriendError();

    if (!this.friends.includes(id)) this.friends.push(id);
    else throw new FriendAlreadyAddedError();
  }

  removeFriend(id: string) {
    this.friends = this.friends.filter((f) => f !== id);
  }

  setPublicity(publicity: boolean) {
    this.isPublic = publicity;
  }

  private _validateName(name: string) {
    if (name.length > 128) throw new NameTooLongError(128);
  }

  private _validateDescription(description: string) {
    if (description.length > 1024) throw new DescriptionTooLongError(1024);
  }
}

export default FileLink;
