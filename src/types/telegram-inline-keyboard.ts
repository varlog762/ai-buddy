import type { TelegramInlineKeyboardItem } from './telegram-inline-keyboard-item';

export interface TelegramInlineKeyboard {
  reply_markup?: {
    inline_keyboard: TelegramInlineKeyboardItem[][];
  };
}
