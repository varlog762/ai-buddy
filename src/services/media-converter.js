import ffmpeg from 'fluent-ffmpeg';

export const checkFfmpegAvailable = () => {
  ffmpeg.getAvailableFormats((err, formats) => {
    if (err) {
      console.error('FFmpeg is not available:', err);
    } else {
      console.log('FFmpeg is ready!', formats);
    }
  });
};
