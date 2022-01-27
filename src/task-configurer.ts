import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { Readable, Writable } from "stream";
import { HeaderSetter, PathAndPayloadSetter, PathSetter, Server } from "./api";

export interface TaskConfigurer {
    readonly task: Server,
    payloadSender?: PayloadSender
}

export type PayloadSender = (res: ServerResponse) => void;

export const defaulHeaders: IncomingHttpHeaders = {
    'host': '127.0.0.1',
    'user-agent': 'test',
};

export function headerSetter(builder: TaskConfigurer, req: IncomingMessage): HeaderSetter {
    return (headers: IncomingHttpHeaders) => {
        req.headers = Object.assign(Object.create(defaulHeaders), headers);
        return builder.task;
    };
}

export function methodSetter(builder: TaskConfigurer, req: IncomingMessage, method: string): PathSetter {
    return (path: string) => {
        req.url = path;
        req.method = method;
        return builder.task;
    };
}

export function methodAndPayloadSetter(builder: TaskConfigurer, req: IncomingMessage, method: string): PathAndPayloadSetter {
    return (path: string, payload?: any) => {
        req.url = path;
        req.method = method;

        builder.payloadSender = payloadSenderFactory(req, payload === undefined ? Buffer.of() : payload);

        return builder.task;
    };
}

export function payloadSenderFactory(req: IncomingMessage, payload: any): PayloadSender {
    const writer = (res: ServerResponse) => {
        if (!req.listenerCount('data')) {
            if (!res.headersSent) {
                setTimeout(() => writer(res));
            }
            return;
        }

        if (!req.headers['content-type']) {
            req.headers['content-type'] = 'application/json';
        }

        if (payload && Buffer.isBuffer(payload)) {
            req.emit('data', payload);
            req.emit('end');
            return;
        }

        if (payload && payload instanceof Readable) {
            const echo = new Writable({
                write (chunk, encoding, next) {
                    req.emit('data', chunk);
                    next();
                }
            });
            echo.once('close', () => req.emit('end'));
            payload.pipe(echo);
            return;
        }

        req.emit('data', JSON.stringify(payload));
        req.emit('end');
    };
    return writer;
}