import { createApp } from './app.js';

export function createServer() {
    const app = createApp();
    return app.listen(process.env.PORT || 3000, () => {
        console.log(`Server running on port http://localhost:${process.env.PORT || 3000}`);
    });
}
