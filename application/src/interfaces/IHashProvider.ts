export default interface IHashProvider {
  verify(str: string, hash: string): boolean;
  generate(str: string): string;
}
