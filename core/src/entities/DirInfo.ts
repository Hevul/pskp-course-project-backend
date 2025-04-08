import DirectoryNameEndsWithDotError from "../errors/DirectoryNameEndsWithDotError";
import EmptyFileNameError from "../errors/EmptyFileNameError";
import ForbiddenCharactersError from "../errors/ForbiddenCharactersError";
import InvalidDirectoryCharactersError from "../errors/InvalidDirectoryCharactersError";
import LeadingTrailingSpacesError from "../errors/LeadingTrailingSpacesError";
import NameTooLongError from "../errors/NameTooLongError";
import NonPrintableCharactersError from "../errors/NonPrintableCharactersError";
import ReservedNameError from "../errors/ReservedNameError";

class DirInfo {
  private _name: string;
  public files: string[] = [];
  public subdirectories: string[] = [];

  constructor(
    name: string,
    public uploadAt: Date,
    public storage: string,
    public parent?: string,
    public id: string = ""
  ) {
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
    if (!name || name.length === 0) throw new EmptyFileNameError();

    if (name.length > 255) throw new NameTooLongError(255);

    const forbiddenChars = ["/", "\0", "\\"];
    if (forbiddenChars.some((char) => name.includes(char)))
      throw new ForbiddenCharactersError(forbiddenChars);

    const forbiddenNames = [".", ".."];
    if (forbiddenNames.includes(name)) throw new ReservedNameError(name);

    if (/[\x00-\x1F\x7F]/.test(name)) throw new NonPrintableCharactersError();

    if (name !== name.trim()) throw new LeadingTrailingSpacesError();

    if (name.endsWith(".")) throw new DirectoryNameEndsWithDotError();

    if (!/^[a-zA-Z0-9_\-\.\s]+$/.test(name))
      throw new InvalidDirectoryCharactersError(
        "буквы, цифры, _, -, ., пробел"
      );
  }

  addFile(fileInfoId: string) {
    if (!this.files.includes(fileInfoId)) this.files.push(fileInfoId);
  }

  removeFile(fileInfoId: string) {
    this.files = this.files.filter((f) => f !== fileInfoId);
  }

  addSubdirectory(subdirectoryId: string) {
    if (!this.subdirectories.includes(subdirectoryId))
      this.subdirectories.push(subdirectoryId);
  }

  removeSubdirectory(subdirectoryId: string) {
    this.subdirectories = this.subdirectories.filter(
      (d) => d !== subdirectoryId
    );
  }
}

export default DirInfo;
