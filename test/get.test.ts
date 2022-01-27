import * as express from 'express';
import * as supertest from 'supertest';
import { createServer } from '../src/server-factory';

const textPayload = 'hello world!';

const app = express();
app.get('/', (req, res) => {
    res.send(textPayload);
});

it('should get hello world! with rest-assured', async () => {
    const response = await createServer(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.buffer).toEqual(Buffer.from(textPayload));
});

it('should get hello world! with supertest', async () => {
    const response = await supertest(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toEqual(textPayload);
});