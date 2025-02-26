import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const projectPath = path.dirname(fileURLToPath(import.meta.url));

const isDirectoryExists = async absolutePath => {
  try {
    const stats = await fs.stat(absolutePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
};

const mkDir = async absolutePath => {
  try {
    await fs.mkdir(absolutePath);
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
