import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import { HeaderSetter, PathAndPayloadSetter, PathSetter, RestCall } from "./api";

export interface TaskConfigurer {
    readonly task: RestCall,
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

        builder.payloadSender = payload && payloadSenderFactory(req, payload);

        return builder.task;
    };
}

export function payloadSenderFactory(req: IncomingMessage, payload: any): PayloadSender {
    const writer = (res: ServerResponse) => {
        if (!req.listenerCount('data')) {
            if (!res.headersSent) {
                process.nextTick(() => writer(res));
            }
            return;
        }
        req.headers['content-type'] = 'application/json';
        req.emit('data', JSON.stringify(payload));
        req.emit('end');
    };
    return writer;
}