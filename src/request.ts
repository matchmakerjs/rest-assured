import { IncomingMessage, RequestListener } from "http";
import { Socket } from "net";
import { RestCall } from "./api";
import { defaulHeaders } from "./task-configurer";
import { taskFactory } from "./task-factory";

const socket = Object.create(
    new Socket(),
    {
        remoteAddress: {
            get: () => '127.0.0.1'
        }
    }) as Socket;

export function request(listener: RequestListener): RestCall {

    const req = new IncomingMessage(socket);
    req.method = 'GET';
    req.url = '/';
    req.headers = defaulHeaders;

    return taskFactory(req, listener);
}
