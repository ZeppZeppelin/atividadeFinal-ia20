import express from "express"

import { RunResult } from "sqlite3"
import cors from "cors"
import database from "./database"
import multer from 'multer'
import path from 'path'
import { WebSocketServer } from 'ws'

const port = 8080
const app = express()
const __imgdirname = "C:/Users/Familía/Documents/GitHub/atividadeFinal-ia20/backEnd/"
const session: any = {}

// WS
const wss = new WebSocketServer({ port: 8090 })

const wsList: any[] = []
// MULTER & FS

const storage = multer.diskStorage({
   destination: "./images",
   filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
      cb(
         null,
         uniqueSuffix + "-" + file.originalname
      );
   },
});
const upload = multer({ storage: storage })

const fs = require('fs').promises

// 
app.use(cors())
app.use(express.json())

// STATIC
app.use("/", express.static("../frontEnd/dist"))

// BUSCAR TODOS OS USUÁRIOS
app.get("/api/users", (req, res) => {
   const sql = "SELECT id, name, email FROM user"

   database.all(sql, [], (err, rows) => {
      if (err) {
         res.status(400).json({ "error": err.message })
         return
      }

      res.json({
         "message": "success",
         "data": rows
      })
   })
})

// BUSCAR UM USUÁRIO
app.get("/api/user/:id", (req, res) => {
   const sql = "SELECT id, name, email FROM user WHERE id = ?"

   database.get(sql, [req.params.id], (err, row) => {
      if (err) {
         res.status(400).json({ "error": err.message });
         return;
      }

      res.json({
         "message": "success",
         "data": row
      })
   })
})

// CREATE
app.post("/api/user/", (req, res) => {
   const errors = []
   // const duplicateEmailCheck = 'SELECT EXISTS(SELECT email FROM user WHERE email=?)'
   // let duplicateEmail = false



   if (!req.body.password)
      errors.push("No password specified")

   if (!req.body.email) {
      errors.push("No email specified")
   }

   /* database.get(duplicateEmailCheck, [req.body.email], (err, row) => {
      if (err) {
         res.status(400).json({ "error": err.message })
         console.log(err.message)
         return
      } 
      duplicateEmail = JSON.parse(row)
   })

   if (duplicateEmail)
      errors.push("Email already has an account!") */

   if (errors.length) {
      res.status(400).json({ "error": errors.join() })
      return;
   }

   const { name, email, password } = req.body
   const sql = 'INSERT INTO user (name, email, password) VALUES (?,?,?)'
   const params = [name, email, password]

   database.run(sql, params, function (this: RunResult, err) {
      if (err) {
         res.status(400).json({ "error": err.message })
         return
      }

      res.json({
         "message": "success",
         "data": { name, email, password },
         "id": this.lastID
      })
   })
})

// UPDATE
app.patch("/api/user/:id", (req, res) => {
   const { name, email, password } = req.body
   const sql = `
      UPDATE user SET 
         name = COALESCE(?,name), 
         email = COALESCE(?,email), 
         password = COALESCE(?,password) 
      WHERE 
         id = ?
   `

   database.run(sql, [name, email, password, req.params.id],
      function (this: RunResult, err) {
         if (err) {
            res.status(400).json({ "error": err.message })
            return
         }

         res.json({
            message: "success",
            data: { name, email, password },
            changes: this.changes
         })
      }
   )
})

// DELETE
app.delete("/api/user/:id", (req, res) => {
   const sql = 'DELETE FROM user WHERE id = ?'
   database.run(sql, [req.params.id],
      function (this: RunResult, err) {
         if (err) {
            res.status(400).json({ "error": err.message })
            return;
         }

         res.json({ "message": "deleted", changes: this.changes })
      }
   )
})

// Login
app.post("/api/login/", (req, res) => {
   const sql = "SELECT id, name, email FROM user WHERE email=? AND password=?"
   const { email, password } = req.body

   database.get(sql, [email, password], (err, row) => {
      if (err) {
         res.status(400).json({ "error": err.message })
         return
      }

      if (!row?.id) {
         res.status(404).json({ "message": "user not found!" })
         return
      }
      require('crypto').randomBytes(48, (err: any, buffer: any) => {
         if (err) {
            res.status(400).json({ "error": err.message })
            return
         }
         const token = buffer.toString('hex')
         session[token] = row
         res.json({ "message": "success", "sesid": token })
      })
   })
})

// Teste sesid
app.post("/api/logged/:sesid", (req, res) => {
   res.json(session[req.params.sesid] || "nada")
})

// Logoff

app.post("/api/logoff/:sesid", (req, res) => {
   delete session[req.params.sesid]
   res.json({ "message": "success" })
})

// Image Create

app.post("/api/upload/image", upload.single('avatar'), (req, res, err) => {

   if (req.file == undefined) {
      console.log("File not Found")
      res.status(400).json({ "error": "File not Found" })
      return
   }
   if (!(req.file.mimetype == "image/jpeg" || req.file.mimetype == "image/png" || req.file.mimetype == "image/jpg")) {
      res.status(400).json({ "error": "File type not supported. Use png, jpeg ou jpg" })
      return
   }
   if (req.file.mimetype == undefined) {
      res.status(400).json({ "error": "File is typeless" })
      return
   }

   const Imagepath = "images/" + req.file.filename
   const sql = "INSERT INTO imagens (name, type, path) VALUES(?,?,?)"
   const params = [req.file.filename, req.file.mimetype, Imagepath]

   console.log("Before DB update \n File's mimetype: " + req.file.mimetype +
      "\n File's name: " + req.file.filename + "\n File's Path: " + Imagepath)

   database.run(sql, params, function (this: RunResult, err) {
      if (err) {
         res.status(400).json({ "error": err.message })
         return
      }
      res.json({
         "message": "success",
         "data": { Imagepath }
      })
      console.log("After DB update \n File path: " + Imagepath + " \n Image ID: ")
   })
})

// Image GET

app.get("/api/get/image/:id", (req,res) => {
   const sql = "SELECT path FROM imagens WHERE id = ?"
   database.get(sql, [req.params.id], (err, row) => {
      if (err) {
         res.status(400).json({ "error": err.message });
         return
      } 
      console.log(row)
      if(row != undefined) res.status(200).sendFile(path.join(__dirname,"../", row.path))
   })
})

// WebSocket

app.use("/Chat", express.static("../frontEnd/src/pages/ChatPage.html"))


wss.on('connection', ws => {
   wsList.push(ws)
   console.log("Conected")
   ws.on('message', data => {
      console.log("Conected")
     wsList.forEach(cws => {
       cws.send(data.toString())
     })
   })
 
   ws.send('Oi como vai querido(a)!?')
 })

app.listen(port, () => console.log(`⚡ servidor ${port}`))