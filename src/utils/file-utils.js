import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const projectPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

export const audioDir = path.join(projectPath, 'src/audio');

export const createFileName = (chatId, fileId, extension) =>
  `${chatId}_${fileId}.${extension}`;

const isDirectoryExists = async absolutePath => {
  try {
    const stats = await fs.promises.stat(absolutePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const mkDir = async absolutePath => {
  try {
    await fs.promises.mkdir(absolutePath);
    console.log(absolutePath, ' created!');
  } catch (error) {
    console.error('Error creating directory: ', error);
  }
};

const handleDirectoryCreation = async dirName => {
  try {
    const absolutePath = path.join(projectPath, dirName);

    if (await isDirectoryExists(absolutePath)) {
      console.log(absolutePath, ' already exists');
      return;
    }

    await mkDir(absolutePath);
  } catch (error) {
    console.error(error);
  }
};

// Функция для сохранения файла с использованием потоков
export const saveFileStream = async (buffer, fileName, dirName = 'audio') => {
  const filePath = path.join(projectPath, dirName, fileName);

  await handleDirectoryCreation(dirName);

  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(buffer);
  writeStream.end();

  writeStream.on('finish', () => {
    console.log(`File ${fileName} has been saved successfully.`);
  });

  writeStream.on('error', err => {
    console.error('Error writing the file:', err);
  });
};
