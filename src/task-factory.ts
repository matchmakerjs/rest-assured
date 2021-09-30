import {
    IncomingMessage,
    OutgoingHttpHeader,
    OutgoingHttpHeaders,
    RequestListener,
    ServerResponse
} from "http";
import { Response, Server } from "./api";
import { DataSink } from "./data-sink";
import {
    headerSetter,
    methodAndPayloadSetter,
    methodSetter,
    PayloadSender,
    TaskConfigurer
} from "./task-configurer";

export function taskFactory(req: IncomingMessage, listener: RequestListener): Server {
    const sink = new DataSink();
    const res = createResponse(req, sink);

    let payloadSender: PayloadSender;
    const task = Promise.resolve()
        .then(() => new Promise<Response>(async (resolve, reject) => {
            try {
                if (payloadSender) {
                    payloadSender(res);
                }
                const listenerResult = listener(req, res) as any;
                if (listenerResult?.constructor === Promise) {
                    await listenerResult;
                }
                const result = {
                    statusCode: res.statusCode,
                    headers: res.getHeaders(),
                    buffer: sink.buffer,
                    parseJson: () => JSON.parse(sink.buffer.toString())
                } as Response;
                resolve(result);
            } catch (error) {
                reject(error);
            }
        })) as Server;

    configureTask(Object.create({ task }, {
        payloadSender: {
            set: (val) => payloadSender = val
        }
    }), req);
    return task;
}

function createResponse(req: IncomingMessage, sink: DataSink): ServerResponse {
    const serverResponse = new ServerResponse(req);
    let responseHeaders: OutgoingHttpHeaders;
    return Object.create(
        serverResponse,
        {
            writeHead: {
                get: () => (statusCode: number, headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]) => {
                    if (headers && !Array.isArray(headers)) {
                        // console.log(headers);
                        responseHeaders = headers;
                    }
                    serverResponse.writeHead(statusCode, headers);
                }
            },
            write: {
                get: () => sink.getAppender()
            },
            end: {
                get: () => (...args: any) => {
                    sink.getAppender().apply(null, args);
                    if (args.length) {
                        const callback = args[args.length - 1];
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }
                    serverResponse.end();
                    serverResponse.emit('finish');
                }
            },
            getHeaders: {
                get: () => (() => responseHeaders)
            },
        }) as ServerResponse;
}

function configureTask(configurer: TaskConfigurer, req: IncomingMessage) {
    configurer.task.withHeaders = headerSetter(configurer, req);

    configurer.task.head = methodSetter(configurer, req, 'HEAD');
    configurer.task.get = methodSetter(configurer, req, 'GET');
    configurer.task.delete = methodSetter(configurer, req, 'DELETE');
    configurer.task.post = methodAndPayloadSetter(configurer, req, 'POST');
    configurer.task.patch = methodAndPayloadSetter(configurer, req, 'PATCH');
    configurer.task.put = methodAndPayloadSetter(configurer, req, 'PUT');
}
