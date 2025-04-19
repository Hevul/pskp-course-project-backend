import fs from "fs";
import path from "path";

interface CleanupOptions {
  tempDir: string;
  maxFileAge?: number;
  interval?: number;
  logged?: boolean;
}

export function setupTempFileCleanup(options: CleanupOptions): () => void {
  const { tempDir, maxFileAge = 15, interval = 5, logged = false } = options;

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const cleanStaleFiles = () => {
    try {
      const now = Date.now();
      const files = fs.readdirSync(tempDir);

      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          const fileAge = (now - stats.mtimeMs) / (1000 * 60);

          if (fileAge > maxFileAge) {
            fs.unlinkSync(filePath);
            if (logged)
              console.log(
                `Удалён старый временный файл: ${filePath} (возраст: ${fileAge.toFixed(
                  2
                )} минут)`
              );
          }
        }
      });
    } catch (error) {
      console.error("Ошибка при очистке временных файлов:", error);
    }
  };

  cleanStaleFiles();

  const intervalMs = interval * 60 * 1000;
  const cleanupInterval = setInterval(cleanStaleFiles, intervalMs);

  return () => {
    clearInterval(cleanupInterval);
    console.log("Автоматическая очистка временных файлов остановлена");
  };
}
