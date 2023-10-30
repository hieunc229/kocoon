# Rumbo Typescript Template

This template contains basic setup and scripts, including
- API routes (located at `src/api`)
- React client (located at `/src/client`)
- Build scripts (located at `/scripts`)

## Installation and Usage

1. Clone this repository to your PC
2. Run `npm install` or `yarn` to install dependencies
3. Run `npm run dev` or `yarn dev` to start the development server

## Available Scripts

This template comes with scripts to bundle client and server codes, located at `/scripts` directory.

### Development

Run `npm run dev` or `yarn dev` to start the development server.

This script will generate required files, then start your express instance at `http://localhost:3000`


### Build

Run `npm run build` or `yarn build` to bundle codes

This script will bundle all client, server codes, including styles and native npm modules. Since the bundle includes required modules, you can run the server (which include apis and clients) directly without install any modules

Once completed, you can run the server with node by using `node bundle/server/index.js`, or use deamon process manager like `PM2` to run your app on the background

### Clean

Run `npm run clean` or `yarn clean` to clean up rumbo files on your project

Both development and build scritps generate neccessary files to run the app. You can use this clean code to remove them