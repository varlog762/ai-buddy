import ffmpeg from 'fluent-ffmpeg';
import { handleDirectoryCreation, deleteFile } from '../utils/file-utils.js';

export const isFfmpegInstalled = async () => {
  ffmpeg.getAvailableFormats((err, formatsList) => {
    if (err) return false;
    if (formatsList) return true;

    return false;
  });
};

export const convertOggToWav = async oggFilePath => {
  try {
    if (!oggFilePath) throw new Error('No file path provided');
    if (!isFfmpegInstalled()) throw new Error('FFmpeg not found!');
    await handleDirectoryCreation('audio');

    const wavFilePath = oggFilePath.replace('.ogg', '.wav');

    return new Promise((resolve, reject) => {
      ffmpeg(oggFilePath)
        .toFormat('wav')
        .on('end', () => {
          console.log(`File converted successfully: ${wavFilePath}`);
          resolve(wavFilePath);
        })
        .on('error', err => {
          console.error('Conversion error:', err);
          reject(err);
        })
        .save(wavFilePath);
    }).finally(() => {
      deleteFile(oggFilePath);
    });
  } catch (error) {
    console.error('File conversion error:', error);
    return null;
  }
};
