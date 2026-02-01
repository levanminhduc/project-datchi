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

## 📱 QR Code Features

Tính năng quét và in mã QR cho quản lý kho chỉ:

### Quét mã QR

- **Tra cứu nhanh**: Quét mã QR/barcode để tìm kiếm cuộn chỉ trong kho
- **Xuất chỉ**: Quét liên tục nhiều cuộn khi xuất chỉ cho sản xuất
- **Kiểm kê**: Trang kiểm kê chuyên dụng (`/thread/stocktake`) để đối chiếu tồn kho thực tế với database

### In nhãn QR

- **In đơn**: In nhãn QR cho từng cuộn chỉ (50x30mm)
- **In hàng loạt**: In nhiều nhãn trên giấy A4 (5 cột x 10 hàng)
- **Sau nhập kho**: Tự động đề xuất in nhãn sau khi nhập kho thành công

### Sử dụng

1. **Quét tra cứu**: Nhấn nút "Quét tra cứu" trên trang Tồn kho
2. **In nhãn đơn**: Nhấn nút "In QR" trong menu actions của từng cuộn
3. **Kiểm kê kho**: Truy cập `/thread/stocktake`, chọn kho và bắt đầu quét

### Yêu cầu

- Camera hoặc máy quét barcode USB
- HTTPS hoặc localhost (yêu cầu của trình duyệt cho camera)
- Máy in hỗ trợ khổ 50x30mm hoặc A4

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
