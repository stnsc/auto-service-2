// declaring modules so that typescript doesn't complain anymore
declare module "*.css"
declare module "maplibre-gl/dist/maplibre-gl.css"

declare const process: {
    env: Record<string, string | undefined>
}