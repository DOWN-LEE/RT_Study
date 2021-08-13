process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import App from './app';
import AuthRoute from './routes/auth.route';

const app = new App([new AuthRoute()]);

app.listen();
