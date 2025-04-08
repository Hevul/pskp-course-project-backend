import IBlackListRepository from "../../../core/src/repositories/IBlackRepository";
import IUserRepository from "../../../core/src/repositories/IUserRepository";
import InvalidLoginError from "../errors/InvalidLoginError";
import InvalidPasswordError from "../errors/InvalidPasswordError";
import IAuthService from "../interfaces/IAuthService";
import IHashProvider from "../interfaces/IHashProvider";
import IJwtProvider from "../interfaces/IJwtProvider";

class AuthService implements IAuthService {
  constructor(
    private readonly _userRepository: IUserRepository,
    private readonly _blackListRepository: IBlackListRepository,
    private readonly _jwt: IJwtProvider,
    private readonly _hash: IHashProvider
  ) {}

  async login(login: string, password: string): Promise<string> {
    const exists = await this._userRepository.exists(login);

    if (!exists) throw new InvalidLoginError();

    const user = await this._userRepository.getByLogin(login);

    const isCorrectPassword: boolean = this._hash.verify(
      password,
      user.password
    );

    if (!isCorrectPassword) throw new InvalidPasswordError();

    const jwtToken = this._jwt.generate(user);

    await this._blackListRepository.removeByUserId(user.id);

    return jwtToken;
  }

  async logout(userId: string): Promise<void> {
    const exists = await this._blackListRepository.existsByUserId(userId);

    if (!exists) await this._blackListRepository.add(userId);
  }

  async isLoggedOut(userId: string): Promise<boolean> {
    return await this._blackListRepository.existsByUserId(userId);
  }
}

export default AuthService;
