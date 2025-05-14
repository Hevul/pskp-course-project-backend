import CannotAddSelfAsFriendError from "../../../core/src/errors/CannotAddSelfAsFriendError";
import FriendAlreadyAddedError from "../../../core/src/errors/FriendAlreadyAddedError";
import { FileLink } from "../utils/imports";

describe("FileLink addFriend()", () => {
  const baseOptions = {
    link: "http://example.com/file",
    ownerId: "owner123",
    fileInfoId: "file123",
  };

  it("should add friend successfully when valid friendId provided", () => {
    const fileLink = new FileLink(baseOptions);
    const friendId = "friend456";

    fileLink.addFriend(friendId);

    expect(fileLink.friends).toContain(friendId);
    expect(fileLink.friends.length).toBe(1);
  });

  it("should throw CannotAddSelfAsFriendError when adding owner as friend", () => {
    const fileLink = new FileLink(baseOptions);

    expect(() => fileLink.addFriend(baseOptions.ownerId)).toThrow(
      CannotAddSelfAsFriendError
    );
    expect(fileLink.friends.length).toBe(0);
  });

  it("should throw FriendAlreadyAddedError when adding duplicate friend", () => {
    const fileLink = new FileLink(baseOptions);
    const friendId = "friend456";

    fileLink.addFriend(friendId);

    expect(() => fileLink.addFriend(friendId)).toThrow(FriendAlreadyAddedError);
    expect(fileLink.friends.length).toBe(1);
  });

  it("should allow adding multiple different friends", () => {
    const fileLink = new FileLink(baseOptions);
    const friend1 = "friend1";
    const friend2 = "friend2";
    const friend3 = "friend3";

    fileLink.addFriend(friend1);
    fileLink.addFriend(friend2);
    fileLink.addFriend(friend3);

    expect(fileLink.friends).toEqual(
      expect.arrayContaining([friend1, friend2, friend3])
    );
    expect(fileLink.friends.length).toBe(3);
  });
});
