import { promises as fs } from "fs";

export async function createDirIfNotExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (mkdirError) {
        console.error(`Ошибка при создании директории ${dirPath}:`, mkdirError);
      }
    } else {
      console.error(`Ошибка при проверке директории ${dirPath}:`, error);
    }
  }
}
