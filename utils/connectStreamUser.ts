// utils/connectStreamUser.ts
import { streamClient } from './streamClient';

export const connectStreamUser = async ({ id, name, image }) => {
  await streamClient.connectUser(
    {
      id,
      name,
      image,
    },
    streamClient.devToken(id) // dev token for testing only
  );
};
