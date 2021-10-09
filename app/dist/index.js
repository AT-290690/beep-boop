import { Quiver } from './qvr/qvr.js';
const qvr = new Quiver();
qvr.setNodes({
  modules: {
    key: 'modules',
    next: ['connection', 'app'],
    prev: null,
    level: 0,
    type: 'root'
  },
  connection: {
    key: 'connection',
    next: [],
    prev: 'modules',
    level: 1,
    type: 'leaf'
  },
  app: {
    key: 'app',
    next: ['listen'],
    prev: 'modules',
    level: 1,
    type: 'branch'
  },
  listen: { key: 'listen', next: [], prev: 'app', level: 2, type: 'leaf' },
  'POST/register': {
    key: 'POST/register',
    next: ['register[request]'],
    prev: 'listen',
    level: 0,
    type: 'root'
  },
  'register[request]': {
    key: 'register[request]',
    next: ['createUser'],
    prev: 'POST/register',
    level: 1,
    type: 'branch'
  },
  createUser: {
    key: 'createUser',
    next: ['mongoCreateUser'],
    prev: 'register[request]',
    level: 2,
    type: 'branch'
  },
  mongoCreateUser: {
    key: 'mongoCreateUser',
    next: ['mongoCreateUserEnd'],
    prev: 'createUser',
    level: 3,
    type: 'branch'
  },
  mongoCreateUserEnd: {
    key: 'mongoCreateUserEnd',
    next: [],
    prev: 'mongoCreateUser',
    level: 4,
    type: 'leaf'
  },
  'PUT/login': {
    key: 'PUT/login',
    next: ['login[request]'],
    prev: 'mongoCreateUserEnd',
    level: 0,
    type: 'root'
  },
  'login[request]': {
    key: 'login[request]',
    next: ['login[response]'],
    prev: 'PUT/login',
    level: 1,
    type: 'branch'
  },
  'login[response]': {
    key: 'login[response]',
    next: [],
    prev: 'login[request]',
    level: 2,
    type: 'leaf'
  },
  'PUT/logout': {
    key: 'PUT/logout',
    next: [],
    prev: 'login[response]',
    level: 0,
    type: 'root'
  },
  serviceErrorHandler: {
    key: 'serviceErrorHandler',
    next: [],
    prev: 'PUT/logout',
    level: 0,
    type: 'root'
  },
  sendError: {
    key: 'sendError',
    next: [],
    prev: 'serviceErrorHandler',
    level: 0,
    type: 'root'
  },
  '/': { key: '/', next: [], prev: 'sendError', level: 0, type: 'root' },
  '/about': { key: '/about', next: [], prev: '/', level: 0, type: 'root' },
  middlewares: {
    key: 'middlewares',
    next: ['bodyParser', 'helmet', 'static', 'passport', 'jwt'],
    prev: '/about',
    level: 0,
    type: 'root'
  },
  bodyParser: {
    key: 'bodyParser',
    next: [],
    prev: 'middlewares',
    level: 1,
    type: 'leaf'
  },
  helmet: {
    key: 'helmet',
    next: [],
    prev: 'middlewares',
    level: 1,
    type: 'leaf'
  },
  static: {
    key: 'static',
    next: [],
    prev: 'middlewares',
    level: 1,
    type: 'leaf'
  },
  passport: {
    key: 'passport',
    next: [],
    prev: 'middlewares',
    level: 1,
    type: 'leaf'
  },
  jwt: { key: 'jwt', next: [], prev: 'middlewares', level: 1, type: 'leaf' },
  'GET/byAuthor': {
    key: 'GET/byAuthor',
    next: ['byAuthor[parseQuery]'],
    prev: 'jwt',
    level: 0,
    type: 'root'
  },
  'byAuthor[parseQuery]': {
    key: 'byAuthor[parseQuery]',
    next: ['byAuthor[fetchFromDB]'],
    prev: 'GET/byAuthor',
    level: 1,
    type: 'branch'
  },
  'byAuthor[fetchFromDB]': {
    key: 'byAuthor[fetchFromDB]',
    next: ['byAuthor[response]'],
    prev: 'byAuthor[parseQuery]',
    level: 2,
    type: 'branch'
  },
  'byAuthor[response]': {
    key: 'byAuthor[response]',
    next: [],
    prev: 'byAuthor[fetchFromDB]',
    level: 3,
    type: 'leaf'
  },
  'GET/piece': {
    key: 'GET/piece',
    next: ['piece[response]'],
    prev: 'byAuthor[response]',
    level: 0,
    type: 'root'
  },
  'piece[response]': {
    key: 'piece[response]',
    next: [],
    prev: 'GET/piece',
    level: 1,
    type: 'leaf'
  },
  'DELETE/remove': {
    key: 'DELETE/remove',
    next: ['mongoRemovePiece'],
    prev: 'piece[response]',
    level: 0,
    type: 'root'
  },
  mongoRemovePiece: {
    key: 'mongoRemovePiece',
    next: ['removePieceEnd'],
    prev: 'DELETE/remove',
    level: 1,
    type: 'branch'
  },
  removePieceEnd: {
    key: 'removePieceEnd',
    next: [],
    prev: 'mongoRemovePiece',
    level: 2,
    type: 'leaf'
  },
  'POST/insert': {
    key: 'POST/insert',
    next: ['createPiece'],
    prev: 'removePieceEnd',
    level: 0,
    type: 'root'
  },
  createPiece: {
    key: 'createPiece',
    next: ['mongoCreatePiece'],
    prev: 'POST/insert',
    level: 1,
    type: 'branch'
  },
  mongoCreatePiece: {
    key: 'mongoCreatePiece',
    next: ['createPieceEnd'],
    prev: 'createPiece',
    level: 2,
    type: 'branch'
  },
  createPieceEnd: {
    key: 'createPieceEnd',
    next: [],
    prev: 'mongoCreatePiece',
    level: 3,
    type: 'leaf'
  },
  router: {
    key: 'router',
    next: ['home', 'music', 'account'],
    prev: 'createPieceEnd',
    level: 0,
    type: 'root'
  },
  home: { key: 'home', next: [], prev: 'router', level: 1, type: 'leaf' },
  music: { key: 'music', next: [], prev: 'router', level: 1, type: 'leaf' },
  account: { key: 'account', next: [], prev: 'router', level: 1, type: 'leaf' }
});
qvr.func['modules'] = async (__value, __key, __prev, __next) => {
  const imports = {
    express: (await import('express')).default,
    mongoDB: (await import('mongodb')).default,
    dotevn: await import('dotenv'),
    bcrypt: (await import('bcrypt')).default
  };

  const miscs = {
    URL: await import('url'),
    path: await import('path')
  };

  qvr.memo.helpers = {
    hash: imports.bcrypt.hash,
    compare: imports.bcrypt.compare
  };

  imports.dotevn.config();
  const __dirname = miscs.path.dirname(
    miscs.URL.fileURLToPath(import.meta.url)
  );
  return { imports, __dirname };
};
qvr.func['connection'] = async (__value, __key, __prev, __next) => {
  const { MongoClient } = __value.imports.mongoDB;
  const uri = process.env.DB;
  const mongoInstance = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  await mongoInstance.connect(error => {
    if (error) return console.log(error);
    qvr.memo.collections = {
      users: mongoInstance.db('test').collection('users'),
      music: mongoInstance.db('test').collection('music')
    };
  });
};
qvr.func['app'] = async (__value, __key, __prev, __next) => {
  const { imports, __dirname } = __value;
  const app = imports.express();
  await qvr.goTo('middlewares', { imports, __dirname, app });
  await qvr.goTo('router', { imports, __dirname, app });

  app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
  });
  return { app };
};
qvr.func['listen'] = async (__value, __key, __prev, __next) => {
  const { app } = __value;
  const PORT = process.env.PORT;
  app.listen(PORT, err => {
    if (err) console.log('could not start');
    else {
      console.log(`Listening on port ${PORT}`);
      // block these nodes
      qvr.visit('modules');
      qvr.visit('middlewares');
      qvr.visit('serviceErrorHandler');
      qvr.visit('connection');
      qvr.visit('router');
      qvr.visit('app');
      qvr.visit('listen');
      qvr.visit('serviceErrorHandler');
    }
  });
  return 'Starting server!';
};
qvr.func['POST/register'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const { username, password } = req.body;
  const data = {
    username,
    password
  };
  return { data, res };
};
qvr.func['register[request]'] = async (__value, __key, __prev, __next) => {
  const { data, res } = __value;
  const { username, password } = data;

  if (await qvr.memo.collections.users.findOne({ username })) {
    return void qvr.goTo('sendError', {
      error: qvr.memo.serviceErrors.DUPLICATE_USERNAME_RECORD.code,
      res
    });
  }

  const hash = await qvr.memo.helpers.hash(password, 10);
  return { username, hash, res };
};
qvr.func['createUser'] = async (__value, __key, __prev, __next) => {
  const { username, hash, res } = __value;
  const query = { username };
  const update = { $set: { username, password: hash } };
  const options = { upsert: true };
  return { query, update, options, res };
};
qvr.func['mongoCreateUser'] = async (__value, __key, __prev, __next) => {
  return {
    res: __value.res,
    result: await qvr.memo.collections.users.findOneAndUpdate(
      __value.query,
      __value.update,
      __value.options
    )
  };
};
qvr.func['mongoCreateUserEnd'] = async (__value, __key, __prev, __next) => {
  return __value.res.status(201).send(__value.result);
};
qvr.func['PUT/login'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const { username, password } = req.body;
  return { username, password, res, req };
};
qvr.func['login[request]'] = async (__value, __key, __prev, __next) => {
  const { username, password, res, req } = __value;
  const user = await qvr.memo.collections.users.findOne({ username });
  /*
username is not case sensitive
password is case sensitive
*/
  if (
    !user ||
    !user.password ||
    !(await qvr.memo.helpers.compare(password, user.password))
  ) {
    return void qvr.goTo('sendError', {
      error: qvr.memo.serviceErrors.INVALID_SIGNIN.code,
      res
    });
  }
  return { user, res };
};
qvr.func['login[response]'] = async (__value, __key, __prev, __next) => {
  const { user, res } = __value;
  const payload = {
    id: user._id,
    username: user.username
  };
  const token = qvr.memo.helpers.createToken(payload);
  res.status(200).send({ data: payload, token });
};
qvr.func['PUT/logout'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  req.logout();
  res.status(200).send({ message: 'Good bye. I will miss you :(' });
};
qvr.func['serviceErrorHandler'] = async (__value, __key, __prev, __next) => {
  const { app } = __value;

  qvr.memo.serviceErrors = {
    /** Such a record does not exist (when it is expected to exist) */
    RECORD_NOT_FOUND: {
      code: 1,
      status: 404,
      message: 'not found!'
    },
    /** The requirements do not allow more than one of username  resource */
    DUPLICATE_USERNAME_RECORD: {
      code: 2,
      status: 409,
      message: 'Name not available!'
    },
    /** The requirements do not allow such an operation */
    OPERATION_NOT_PERMITTED: {
      code: 4,
      status: 500,
      message: 'Not allowed!'
    },
    /** username/password mismatch */
    INVALID_SIGNIN: {
      code: 5,
      status: 500,
      message: 'Invalid username/password'
    },
    RECORD_NOT_AVAILABLE: {
      code: 6,
      status: 409,
      message: 'is not available!'
    },
    RECORD_GONE: {
      code: 8,
      status: 410,
      message: 'Item no longer available!'
    },
    RESOURCE_IS_FORBIDDEN: {
      code: 10,
      status: 403,
      message: 'action is forbidden.'
    },
    BANNED_USER: {
      code: 11,
      status: 403,
      message: 'You are banned'
    },
    PLACEHOLDER_ERROR: {
      code: 14,
      status: 500,
      message: 'Lorem ispum error'
    }
  };

  qvr.memo.serviceErrorStack = Object.values(qvr.memo.serviceErrors).reduce(
    (acc, item) => {
      acc.set(item.code, { status: item.status, message: item.message });
      return acc;
    },
    new Map()
  );

  const productionErrors = (err, req, res, next) => {
    res.status(err.status ?? 500).send({ error: err.message });
  };

  const developmentErrors = (err, req, res, next) => {
    err.stack = err.stack ?? '';
    const errorDetails = {
      error: err.message,
      status: err.status,
      stackHighlighted: err.stack.split('\n').reduce((acc, item, index) => {
        acc[index] = item.trim();
        return acc;
      }, {})
    };
    res.status(err.status ?? 500).send(errorDetails);
  };

  if (process.env.STAGE === 'development') app.use(developmentErrors);
  else if (process.env.STAGE === 'production') app.use(productionErrors);
};
qvr.func['sendError'] = async (__value, __key, __prev, __next) => {
  const { res, error } = __value;
  res
    .status(qvr.memo.serviceErrorStack.get(error).status)
    .send({ error: qvr.memo.serviceErrorStack.get(error).message });
};
qvr.func['/'] = async (__value, __key, __prev, __next) => {
  return __value.res.sendFile(__value.__dirname + '/public/index.html');
};
qvr.func['/about'] = async (__value, __key, __prev, __next) => {
  return __value.res.status(200).json({ data: 'This site is about music!' });
};
qvr.func['middlewares'] = async (__value, __key, __prev, __next) => {
  const { imports, __dirname, app } = __value;
  const { express } = imports;
  return { express, imports, __dirname, app };
};
qvr.func['bodyParser'] = async (__value, __key, __prev, __next) => {
  return void __value.app.use((await import('body-parser')).default.json());
};
qvr.func['helmet'] = async (__value, __key, __prev, __next) => {
  const { app, imports } = __value;
  const helmet = (await import('helmet')).default;
  app.use(
    helmet(),
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'https://*'],
        fontSrc: ['*'],
        styleSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*'],
        workerSrc: ["'self'", 'data:', 'blob:'],
        frameSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'http://cdnjs.cloudflare.com/',
          'https://unpkg.com/'
        ],
        objectSrc: ["'none'"],
        imgSrc: ["'self'", 'data: *'],
        upgradeInsecureRequests: []
      },
      reportOnly: false
    })
  );
};
qvr.func['static'] = async (__value, __key, __prev, __next) => {
  const { express, __dirname, app } = __value;
  app.use(express.static('app/dist/public'));
  qvr.goTo('serviceErrorHandler', { app });
  return { app };
};
qvr.func['passport'] = async (__value, __key, __prev, __next) => {
  const { app } = __value;
  const passport = (await import('passport')).default;
  const passportJwt = (await import('passport-jwt')).default;
  const options = {
    secretOrKey: process.env.PRIVATE_KEY,
    jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken()
  };
  qvr.memo.extractToken = req => {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  };

  qvr.memo.authenticate = async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, async (error, payload) => {
      if (error || !payload) {
        return res
          .status(401)
          .json({ error: 'Unauthorized, invalid credentials.' });
      }
      req.user = payload;
      next();
    })(req, res, next);
  };

  const jwtStrategy = new passportJwt.Strategy(
    options,
    async (payload, done) => {
      const userData = {
        id: payload.id,
        username: payload.username
      };
      // userData will be set as `req.user` in the `next` middleware
      done(null, userData);
    }
  );
  passport.use(jwtStrategy);
  app.use(passport.initialize());
};
qvr.func['jwt'] = async (__value, __key, __prev, __next) => {
  const jwt = (await import('jsonwebtoken')).default;
  // helper for creating token
  qvr.memo.helpers.createToken = payload => {
    const token = jwt.sign(payload, process.env.PRIVATE_KEY, {
      expiresIn: +process.env.TOKEN_LIFETIME
    });
    return token;
  };
};
qvr.func['GET/byAuthor'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const {
    query: { author, page, perPage }
  } = req;
  return { res, author, page, perPage };
};
qvr.func['byAuthor[parseQuery]'] = async (__value, __key, __prev, __next) => {
  return {
    res: __value.res,
    author: __value.author?.trim() || '',
    page: +__value.page || 0,
    perPage: +__value.perPage || 10
  };
};
qvr.func['byAuthor[fetchFromDB]'] = async (__value, __key, __prev, __next) => {
  const { res, author, page, perPage } = __value;
  return {
    res,
    result: await qvr.memo.collections.music
      .find({ username: author })
      .sort({ $natural: -1 })
      .limit(perPage)
      .skip(page * perPage)
      .project({ _id: 0, username: 0 })
      .toArray()
  };
};
qvr.func['byAuthor[response]'] = async (__value, __key, __prev, __next) => {
  return __value.res.status(200).send(__value.result);
};
qvr.func['GET/piece'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const result = await qvr.memo.collections.users.findOne({
    title: req.query.title
  });
  if (result) {
    return void qvr.goTo('sendError', {
      error: qvr.memo.serviceErrors.RECORD_NOT_FOUND.code,
      res
    });
  }
  return { res, result };
};
qvr.func['piece[response]'] = async (__value, __key, __prev, __next) => {
  return __value.res.status(200).send(__value.result);
};
qvr.func['DELETE/remove'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const { title, sheet, speed, offset } = req.body;
  return { title, sheet, res, username: req.user.username, speed, offset };
};
qvr.func['mongoRemovePiece'] = async (__value, __key, __prev, __next) => {
  const { title, username, res } = __value;
  const name = username + "'s " + title.trim();
  const query = { title: name };
  qvr.memo.collections.music.deleteOne(query);
  return res;
};
qvr.func['removePieceEnd'] = async (__value, __key, __prev, __next) => {
  return __value.status(201).send({ success: 1 });
};
qvr.func['POST/insert'] = async (__value, __key, __prev, __next) => {
  const { req, res } = __value;
  const { title, sheet, speed, offset } = req.body;
  return {
    title: title?.trim() || new Date().getTime(),
    sheet,
    res,
    username: req.user.username,
    speed,
    offset
  };
};
qvr.func['createPiece'] = async (__value, __key, __prev, __next) => {
  const { title, sheet, username, res, speed, offset } = __value;
  const name = username + "'s " + title;
  const query = { title: name };
  const update = { $set: { title: name, username, speed, offset, sheet } };
  const options = { upsert: true };
  return { query, update, options, res };
};
qvr.func['mongoCreatePiece'] = async (__value, __key, __prev, __next) => {
  return {
    res: __value.res,
    result: await qvr.memo.collections.music.findOneAndUpdate(
      __value.query,
      __value.update,
      __value.options
    )
  };
};
qvr.func['createPieceEnd'] = async (__value, __key, __prev, __next) => {
  return __value.res.status(201).send({ success: 1 });
};
qvr.func['router'] = async (__value, __key, __prev, __next) => {
  const { imports, __dirname, app } = __value;
  /*
helper function
that catches errors
*/
  const catchErrors = fn => (req, res, next) => fn(req, res, next).catch(next);
  /*
helper function
creating endpoints and
handling goTo to requested node
*/
  const listen = (path, access = 'public', route = imports.express.Router()) =>
    (path ? app.use(path, route) : true) &&
    ((method, endpoint) =>
      route[method.toLowerCase()](
        endpoint,
        access === 'public'
          ? (req, res, next) => next()
          : qvr.memo.authenticate,
        (req, res, next) =>
          catchErrors(
            qvr.goTo(method + req.url.split('?')[0], { req, res, next })
          )
      ) && listen(null, access, route));
  return { app, listen, __dirname };
};
qvr.func['home'] = async (__value, __key, __prev, __next) => {
  const { app, __dirname } = __value;
  app.get('/', (_, res) => qvr.goTo('/', { res, __dirname }));
  app.get('/about', (_, res) => qvr.goTo('/about', { res, __dirname }));
};
qvr.func['music'] = async (__value, __key, __prev, __next) => {
  const { app, listen } = __value;
  listen('/music', 'private')('GET', '/byAuthor')('GET', '/piece')(
    'POST',
    '/insert'
  )('DELETE', '/remove');
};
qvr.func['account'] = async (__value, __key, __prev, __next) => {
  const { app, listen } = __value;
  listen('/account', 'public')('POST', '/register')('PUT', '/login')(
    'PUT',
    '/logout'
  );
};
export default async (logging = false) => {
  qvr.logOn = logging;
  qvr.setRoot(qvr.nodes['modules'].key);
  qvr.reset();
  await qvr.goTo(qvr.root);
  return qvr.out();
};
