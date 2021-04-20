import * as express from 'express';
import * as supertest from 'supertest';
import { request } from '../src/request';

const textPayload = 'hello world!';

const app = express();
app.get('/', (req, res) => {
    res.send(textPayload);
});

it('should get hello world! with rest-assured', async () => {
    const response = await request(app);
    expect(response.body).toBe(textPayload);
});

it('should get hello world! with supertest', async () => {
    const response = await supertest(app).get('/');
    expect(response.text).toBe(textPayload);
});