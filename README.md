# Quasar Project

A Vue 3 application built with Quasar Framework, providing a modern and responsive UI development experience.

## ❗️ Important Links

- 📄 [Quasar Docs](https://quasar.dev/)
- 🚨 [Issues](https://github.com/quasarframework/quasar/issues)
- 💬 [Discord](https://discord.gg/5TDhbDg)
- 🎮 [Playground](https://quasar.dev/start/playground)

## 💿 Install

Set up your project using your preferred package manager:

| Package Manager                                                | Command        |
|---------------------------------------------------------------|----------------|
| [yarn](https://yarnpkg.com/getting-started)                   | `yarn install` |
| [npm](https://docs.npmjs.com/cli/v7/commands/npm-install)     | `npm install`  |
| [pnpm](https://pnpm.io/installation)                          | `pnpm install` |
| [bun](https://bun.sh/#getting-started)                        | `bun install`  |

After completing the installation, your environment is ready for Quasar development.

## ✨ Features

- 🖼️ **Optimized Front-End Stack**: Leverage Vue 3 and Quasar 2 for a modern, reactive UI development experience. [Vue 3](https://vuejs.org/) | [Quasar](https://quasar.dev/)
- 🚦 **Routing**: Utilizes Vue Router for SPA navigation. [Vue Router](https://router.vuejs.org/)
- 💻 **Enhanced Development Experience**: Benefit from TypeScript's static type checking and ESLint for code quality. [TypeScript](https://www.typescriptlang.org/) | [ESLint](https://eslint.org/)
- ⚡ **Next-Gen Tooling**: Powered by Vite, experience fast cold starts and instant HMR (Hot Module Replacement). [Vite](https://vitejs.dev/)
- 🧩 **Automated Component Importing**: Streamline your workflow with unplugin-vue-components, automatically importing components as you use them. [unplugin-vue-components](https://github.com/antfu/unplugin-vue-components)
- 🛠️ **Strongly-Typed Vue**: Use vue-tsc for type-checking your Vue components. [vue-tsc](https://github.com/vuejs/language-tools)

## 💡 Usage

### Starting the Development Server

To start the development server with hot-reload, run the following command. The server will be accessible at [http://localhost:3000](http://localhost:3000):

```bash
bun run dev
# or
npm run dev
# or
yarn dev
```

### Building for Production

To build your project for production, use:

```bash
bun run build
# or
npm run build
# or
yarn build
```

## 📁 Project Structure

```
src/
├── assets/           # Static assets (images, etc.)
├── components/       # Reusable Vue components
├── composables/      # Vue composables
├── pages/            # Page components (auto-routing)
├── plugins/          # Vue plugins (Quasar, etc.)
├── router/           # Vue Router configuration
├── styles/           # Global styles and Quasar variables
└── types/            # TypeScript type definitions
```

## 📑 License
[MIT](http://opensource.org/licenses/MIT)
