import fs from "fs"
import path from "path"
import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    (() => {
      const tasksPath = path.resolve(__dirname, "tasks.json")
      const tasksPlugin: Plugin = {
        name: "tasks-json",
        configureServer(server) {
          server.middlewares.use("/api/tasks", (req, res) => {
            if (req.method === "GET") {
              try {
                const contents = fs.readFileSync(tasksPath, "utf8")
                res.setHeader("Content-Type", "application/json")
                res.statusCode = 200
                res.end(contents)
              } catch {
                res.statusCode = 500
                res.end(JSON.stringify({ error: "Failed to read tasks.json" }))
              }
              return
            }

            if (req.method === "PUT") {
              let body = ""
              req.on("data", (chunk) => {
                body += chunk
              })
              req.on("end", () => {
                try {
                  const data = JSON.parse(body)
                  const next = `${JSON.stringify(data, null, 2)}\n`
                  const tmpPath = `${tasksPath}.tmp`
                  fs.writeFileSync(tmpPath, next, "utf8")
                  fs.renameSync(tmpPath, tasksPath)
                  res.setHeader("Content-Type", "application/json")
                  res.statusCode = 200
                  res.end(JSON.stringify({ ok: true }))
                } catch {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: "Invalid JSON payload" }))
                }
              })
              return
            }

            res.statusCode = 405
            res.end(JSON.stringify({ error: "Method not allowed" }))
          })
        },
      }
      return tasksPlugin
    })(),
  ],
})
