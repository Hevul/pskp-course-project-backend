class FileLink {
  constructor(
    public link: string,
    public ownerId: string,
    public fileInfoId: string,
    public friends: string[],
    public isPublic: boolean = true,
    public id: string = ""
  ) {}

  get isPrivate() {
    return !this.isPublic;
  }

  addFriend(id: string) {
    if (!this.friends.includes(id)) this.friends.push(id);
  }

  removeFriend(id: string) {
    this.friends = this.friends.filter((f) => f !== id);
  }

  setPublicity(publicity: boolean) {
    this.isPublic = publicity;
  }
}

export default FileLink;
