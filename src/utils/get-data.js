import 'dotenv/config';

const { TELEGRAM_API_TOKEN: token, TELEGRAM_API_URL: baseUrl } = process.env;

const getFilePath = async voiceMessageFileId => {
  const url = `${baseUrl}bot${token}/getFile?file_id=${voiceMessageFileId}`;
  const response = await fetch(url);
  const fileInfo = await response.json();
  return fileInfo.result?.file_path;
};

export const getVoiceMessageFromTelegram = async voiceMessageFileId => {
  const filePath = await getFilePath(voiceMessageFileId);
  const url = `${baseUrl}file/bot${token}/${filePath}`;
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
};
