/// <reference types="vite/client" />

// Add support for JSON imports
declare module "*.json" {
    const value: any;
    export default value;
}
