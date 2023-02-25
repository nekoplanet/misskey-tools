import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import {Action, useKoaServer} from 'routing-controllers';

import {config, meta} from '../config.js';
import {render} from './render.js';
import {router} from './router.js';
import {getUserByToolsToken} from './functions/users.js';
import controllers from './controllers/index.js';

import 'reflect-metadata';

export default (): void => {
  const app = new Koa();

  console.log('Misskey Tools v' + meta.version);

  console.log('Initializing DB connection...');

  app.use(render);
  app.use(bodyParser());

  useKoaServer(app, {
    controllers,
    routePrefix: '/api/v1',
    classTransformer: true,
    validation: true,
    currentUserChecker: async ({ request }: Action) => {
      const { authorization } = request.header;
      if (!authorization || !authorization.startsWith('Bearer ')) return null;

      const token = authorization.split(' ')[1].trim();
      return await getUserByToolsToken(token);
    },
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  console.log(`listening port ${config.port}...`);
  console.log('App launched!');

  app.listen(config.port || 3000);
};
