import { generateKey } from "~/lib/crypto.server";

(async () => {
  try {
    const key = await generateKey();
    console.log(key.k);
    console.log("Key Generated");
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
  }
})();
