/**
 * Cloudflare Worker Entry Point
 *
 * Routes WebSocket connections to the appropriate GameRoom Durable Object.
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export { GameRoom } from './GameRoom.js'

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      // WebSocket connection to a specific room
      if (url.pathname.startsWith('/room/')) {
        const roomId = url.pathname.split('/')[2]

        if (!roomId) {
          return new Response('Room ID required', { status: 400 })
        }

        // Get the Durable Object stub for this room
        const id = env.GAME_ROOM.idFromName(roomId)
        const stub = env.GAME_ROOM.get(id)

        // Forward the request to the Durable Object
        return stub.fetch(request)
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 })
      }

      // Serve static assets from Workers Site
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
          }
        )
      } catch (e) {
        // If asset not found, return 404
        if (e.status === 404) {
          // For SPA, return index.html for unknown routes
          try {
            return await getAssetFromKV(
              {
                request: new Request(`${url.origin}/index.html`, request),
                waitUntil: ctx.waitUntil.bind(ctx),
              },
              {
                ASSET_NAMESPACE: env.__STATIC_CONTENT,
                ASSET_MANIFEST: JSON.parse(env.__STATIC_CONTENT_MANIFEST),
              }
            )
          } catch {
            return new Response('Not Found', { status: 404 })
          }
        }
        throw e
      }

    } catch (err) {
      console.error('Worker error:', err)
      return new Response(`Internal error: ${err.message}`, { status: 500 })
    }
  }
}
