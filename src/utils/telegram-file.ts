import 'dotenv/config';
import { convertBlobToBuffer } from './index.js';

const { TELEGRAM_API_TOKEN: token, TELEGRAM_API_URL: baseUrl } = process.env;

const getFilePath = async (voiceMessageFileId: string): Promise<string> => {
  const url = `${baseUrl}bot${token}/getFile?file_id=${voiceMessageFileId}`;
  const response = await fetch(url);
  const fileInfo = await response.json();
  return fileInfo.result?.file_path;
};

export const getVoiceMessageFromTelegram = async (
  voiceMessageFileId: string
): Promise<Blob> => {
  const filePath = await getFilePath(voiceMessageFileId);
  const url = `${baseUrl}file/bot${token}/${filePath}`;
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
};

export const getBufferFromTelegramVoiceMessage = async (
  voiceMessageFileId: string
): Promise<Buffer> => {
  try {
    const blob = await getVoiceMessageFromTelegram(voiceMessageFileId);
    return await convertBlobToBuffer(blob);
  } catch (error) {
    console.error('Error processing voice message:', error);
    throw error;
  }
};
