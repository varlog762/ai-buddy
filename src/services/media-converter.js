import ffmpeg from 'fluent-ffmpeg';
import { projectPath } from '../utils/index.js';

export const isFfmpegInstalled = () => {
  let isInstalled = false;

  ffmpeg.getAvailableFormats((err, formatsList) => {
    if (err) {
      isInstalled = false;
    } else if (formatsList) {
      isInstalled = true;
    }
  });

  return isInstalled;
};

export const convertOggToWav = async oggFilePath => {
  try {
    // Проверяем, существует ли папка audio
    await fs.mkdir(audioDir, { recursive: true });

    // Генерируем имя выходного файла (заменяем расширение)
    const wavFilePath = oggFilePath.replace('.ogg', '.wav');

    return new Promise((resolve, reject) => {
      ffmpeg(oggFilePath)
        .toFormat('wav') // Конвертируем в WAV
        .on('end', () => {
          console.log(`Конвертация завершена: ${wavFilePath}`);
          resolve(wavFilePath);
        })
        .on('error', err => {
          console.error('Ошибка конвертации:', err);
          reject(err);
        })
        .save(wavFilePath); // Сохраняем файл
    });
  } catch (error) {
    console.error('Ошибка при обработке файла:', error);
    return null;
  }
};
