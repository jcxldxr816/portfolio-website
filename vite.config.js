import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: path.resolve(__dirname, './res') + '/[!.]*',
                    dest: './res',
                },
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
})