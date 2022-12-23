import {createWriteStream} from "pino-logflare";
import pino from "pino";

const stream = createWriteStream({
    apiKey: process.env.LOGGER_API_KEY!,
    sourceToken: process.env.LOGGER_API_ID!
});

export const logger =
    process.env.NODE_ENV !== 'development'
        ? pino(stream)
        : pino({
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true
                }
            }
        });
