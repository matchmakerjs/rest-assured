import { IncomingMessage, RequestListener, ServerResponse } from "http";
import { Response, RestCall } from "./api";
import { headerSetter, methodAndPayloadSetter, methodSetter, PayloadSender, TaskConfigurer } from "./task-configurer";

export function taskFactory(req: IncomingMessage, listener: RequestListener): RestCall {
    let responseBuffer: Buffer;
    function appendData() {
        if (!arguments.length) {
            return;
        }
        const [chunk, encoding] = arguments;
        if (typeof chunk === 'function') {
            return;
        }
        if (!responseBuffer) {
            responseBuffer = Buffer.from(chunk, encoding);
            return;
        }
        responseBuffer = Buffer.concat([responseBuffer, Buffer.from(chunk, encoding)]);
    }
    const res = createResponse(req, appendData);

    let payloadSender: PayloadSender;
    const task = Promise.resolve()
        .then(() => new Promise<Response>(async (resolve) => {
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
                body: buildResponseBody(res, responseBuffer)
            } as Response;
            resolve(result);
        })) as RestCall;

    configureTask(Object.create({ task }, {
        payloadSender: {
            set: (val) => payloadSender = val
        }
    }), req);
    return task;
}

function createResponse(req: IncomingMessage, appendData: Function): ServerResponse {
    const serverResponse = new ServerResponse(req);
    return Object.create(
        serverResponse,
        {
            write: {
                get: () => appendData
            },
            end: {
                get: () => function () {
                    appendData.apply(null, arguments);
                    if (arguments.length) {
                        const callback = arguments[arguments.length - 1];
                        if (typeof callback === 'function') {
                            serverResponse.end(callback);
                            return;
                        }
                    }

                    serverResponse.end();
                }
            }
        }) as ServerResponse;
}

function buildResponseBody(res: ServerResponse, responseBuffer: Buffer): any {
    if (!responseBuffer?.length) {
        return null;
    }
    const contentType = res.getHeader('content-type') as string;
    if (contentType?.startsWith('application/json')) {
        return JSON.parse(responseBuffer.toString());
    }
    if (contentType?.match('text/.+;?')) {
        return responseBuffer.toString();
    }
    return responseBuffer;
}

function configureTask(configurer: TaskConfigurer, req: IncomingMessage) {
    configurer.task.withHeaders = headerSetter(configurer, req);

    configurer.task.get = methodSetter(configurer, req, 'GET');
    configurer.task.head = methodSetter(configurer, req, 'HEAD');
    configurer.task.post = methodAndPayloadSetter(configurer, req, 'POST');
    configurer.task.patch = methodAndPayloadSetter(configurer, req, 'PATCH');
    configurer.task.put = methodAndPayloadSetter(configurer, req, 'PUT');
    configurer.task.delete = methodSetter(configurer, req, 'DELETE');
}
