export default interface IAuthInterface {
  login(login: string, password: string): Promise<string>;
  logout(userId: string): Promise<void>;
  isLoggedOut(userId: string): Promise<boolean>;
}
