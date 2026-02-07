const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info: (msg: string, data?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ?? '');
  },
  warn: (msg: string, data?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, data ?? '');
  },
  error: (msg: string, err?: unknown) => {
    if (isDev && err instanceof Error) {
      console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err.stack);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err ?? '');
    }
  },
};
