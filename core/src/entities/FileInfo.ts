import EmptyFileNameError from "../errors/EmptyFileNameError";
import ForbiddenCharactersError from "../errors/ForbiddenCharactersError";
import LeadingTrailingSpacesError from "../errors/LeadingTrailingSpacesError";
import NameTooLongError from "../errors/NameTooLongError";
import NonPrintableCharactersError from "../errors/NonPrintableCharactersError";
import ReservedNameError from "../errors/ReservedNameError";

export interface FileInfoParams {
  name: string;
  uploadAt: Date;
  size: number;
  storage: string;
  physicalFileId: string;
  parent?: string;
  id?: string;
  updateAt?: Date;
}

export class FileInfo {
  private _name: string;

  constructor(params: FileInfoParams) {
    this.validateName(params.name);
    this._name = params.name;
    this.uploadAt = params.uploadAt;
    this.size = params.size;
    this.storage = params.storage;
    this.parent = params.parent;
    this.id = params.id || "";
    this.updateAt = params.updateAt;
    this.physicalFileId = params.physicalFileId || this.id;
  }

  public uploadAt: Date;
  public size: number;
  public storage: string;
  public parent?: string;
  public id: string;
  public updateAt?: Date;
  public physicalFileId: string;

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
  }

  public path() {
    return `/${this.storage}/${this.physicalFileId}`;
  }
}
