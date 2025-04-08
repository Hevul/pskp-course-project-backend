import IHashProvider from "../../../application/src/interfaces/IHashProvider";
import crypto from "crypto";

class HashSha256Provider implements IHashProvider {
  verify(str: string, hash: string): boolean {
    const strHash: string = this.generate(str);
    return strHash === hash;
  }

  generate(str: string): string {
    const hash: string = crypto.createHash("sha256").update(str).digest("hex");
    return hash;
  }
}

export default HashSha256Provider;
