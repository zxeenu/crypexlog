# Welcome to Remix!

- 📖 [Remix docs](https://remix.run/docs)

## Versions

You need node in the correct version for this setup to work.

`npm 10.7.0`
`node 20.15.0`

## Development

Run the dev server:

```shellscript
npm run dev
```

## Deployment for Production

First, build your app for production:

```sh
npm run build
```

Then setup your `.env` file

```sh
cp .env.example .env
```

Then generate your secrets. Do this two times, for the SESSION_CIPHER_KEY and the SESSION_SECRET

```sh
npm run key:generate
```

Then apply your migrations

```sh
npm run setup
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `npm run build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.

## DB Migrations (Production)

First, build your app for production:

https://stackoverflow.com/questions/63972581/how-to-run-prisma-generate-in-production

```sh
npx prisma migrate dev
npm run setup
```

## TODO

- [] Sell Log Page, selling functionality + buy log bal resync
- [x] Sell Update + buy log bal resync
- [] error logging route need to implement
- [] dashboard, with profit calculations for days.
- [] timeline per buy record, to go through its child sell records.
- [] PWA implementation
- [] Take CSV of sell and buy logs, all of the data.
