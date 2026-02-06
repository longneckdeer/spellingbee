/**
 * Cloudflare Worker for Durable Objects ONLY
 * Static assets served by Pages
 */

export { GameRoom } from './GameRoom.js'

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url)

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
          }
        })
      }

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

      // Get room counts for all rooms
      if (url.pathname === '/api/room-counts') {
        const roomIds = ['spellingbee-1', 'spellingbee-2', 'spellingbee-3', 'spellingbee-4', 'spellingbee-5']
        const counts = {}

        await Promise.all(roomIds.map(async (roomId) => {
          const id = env.GAME_ROOM.idFromName(roomId)
          const stub = env.GAME_ROOM.get(id)

          try {
            const response = await stub.fetch(new Request(`http://internal/api/player-count`))
            const data = await response.json()
            counts[roomId] = data.count
          } catch (err) {
            console.error(`Error getting count for ${roomId}:`, err)
            counts[roomId] = 0
          }
        }))

        return new Response(JSON.stringify(counts), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response('OK', {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        })
      }

      return new Response('Not Found', {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      })

    } catch (err) {
      console.error('Worker error:', err)
      return new Response(`Internal error: ${err.message}`, {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
  }
}
