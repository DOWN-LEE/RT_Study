process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import App from './app';
import AuthRoute from './routes/auth.route';
import RoomRoute from './routes/room.route';
import TimeRoute from './routes/time.route';

const app = new App([new AuthRoute(), new RoomRoute(), new TimeRoute()]);

app.listen();
