// utils/streamClient.ts
import { StreamChat } from 'stream-chat';

const apiKey = 'bj5ru4c64ycz'; // replace this with your actual API key from GetStream.io
export const streamClient = StreamChat.getInstance(apiKey);
