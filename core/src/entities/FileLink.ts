import CannotAddSelfAsFriendError from "../errors/CannotAddSelfAsFriendError";
import FriendAlreadyAddedError from "../errors/FriendAlreadyAddedError";

class FileLink {
  constructor(
    public link: string,
    public ownerId: string,
    public fileInfoId: string,
    public friends: string[],
    public isPublic: boolean = true,
    public createAt: Date,
    public downloadCount: number,
    public id: string = ""
  ) {}

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
}

export default FileLink;
