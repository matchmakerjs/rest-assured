import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

export interface Response {
    readonly statusCode: number,
    readonly headers: OutgoingHttpHeaders
    readonly buffer?: Buffer,
    readonly parseJson: <T>() => T
}

export type HeaderSetter = (headers: IncomingHttpHeaders) => ResponseSource;
export type PathSetter = (path: string) => ResponseSource;
export type PathAndPayloadSetter = (path: string, payload?: any) => ResponseSource;

type RequestBuilder = {
    withHeaders: (headers: IncomingHttpHeaders) => ResponseSource;
};

export type ResponseSource = Promise<Response> & RequestBuilder;

export type Server = {
    // withMethod: (method: string) => ResponseSource;
    get: PathSetter;
    head: PathSetter;
    delete: PathSetter;
    post: PathAndPayloadSetter
    patch: PathAndPayloadSetter;
    put: PathAndPayloadSetter;
} & ResponseSource;