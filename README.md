# rest-assured

# minimalistic test framework for Restful APIs.

rest-assured is lightweight test framework that works directly with the node RequestListener interface and can therefore be used with any Rest framework.

Unlike supertest, rest-assured does not create an actual server for it make a HTTP call to with the given request configuration. 

rest-assured creates a thin wrapper around the native node request and response objects and uses these to invoke the request listener.

Below is an example using express and Jest:

```
import * as express from 'express';
import { request } from '@olaleyeone/rest-assured';

const textPayload = 'hello world!';

const app = express();
app.get('/', (req, res) => {
    res.send(textPayload);
});

it('should get hello world!', async () => {
    const response = await request(app);
    expect(response.body).toBe(textPayload);
});
```
