import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

export const getAbsoluteFilePath = (
  dirName: string,
  fileName: string
): string => path.join(projectPath, dirName, fileName);

export const createFileName = (chatId: string, extension: string) =>
  `${chatId}_${Date.now().toString()}.${extension}`;

const isDirectoryExists = async (absolutePath: string): Promise<boolean> => {
  try {
    const stats = await fs.promises.stat(absolutePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const mkDir = async (absolutePath: string): Promise<void> => {
  try {
    await fs.promises.mkdir(absolutePath);
    console.log(absolutePath, ' created!');
  } catch (error) {
    console.error('Error creating directory: ', error);
  }
};

export const handleDirectoryCreation = async (
  dirName: string
): Promise<void> => {
  try {
    const absolutePath = path.join(projectPath, dirName);

    if (await isDirectoryExists(absolutePath)) return;

    await mkDir(absolutePath);
  } catch (error) {
    console.error(error);
  }
};

export const saveFileStream = async (
  buffer: Buffer,
  fileName: string,
  dirName: string = 'audio'
): Promise<void> => {
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

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};
