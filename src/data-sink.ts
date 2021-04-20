export class DataSink {
    private _buffer: Buffer;

    get buffer() {
        return this._buffer;
    }

    getAppender() {
        return (...args: any) => {
            if (!args.length) {
                return;
            }
            const [chunk, encoding] = args;
            if (typeof chunk === 'function') {
                return;
            }
            if (!this._buffer) {
                this._buffer = Buffer.from(chunk, encoding);
                return;
            }
            this._buffer = Buffer.concat([this._buffer, Buffer.from(chunk, encoding)]);
        };
    }
}