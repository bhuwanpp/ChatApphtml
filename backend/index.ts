import { Response, Request } from 'express';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { createAdapter } from "@socket.io/postgres-adapter";
import pg from "pg";

const app = express();
const port = 4000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const pool = new pg.Pool({
    user: "postgres",
    host: "localhost",
    database: "postgres",
    password: "12345678",
    port: 5432,
});

const server = http.createServer(app);
const io = new Server(server);



app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/frontend/index.html');
});

pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id   SERIAL PRIMARY KEY,
    client_offset TEXT UNIQUE,
    content TEXT
  );
`);
type resultType = {
    id: number,
    client_offset: string,
    content: string
}

io.on('connection', async (socket) => {
    console.log('a user is connected');
    socket.on('chat message', async (msg) => {
        let result: resultType;
        try {
            const res = await pool.query('INSERT INTO messages (content) VALUES ($1) RETURNING id', [msg]);
            result = res.rows[0];
        } catch (e) {
            console.error('Error inserting message:', e);
            return;
        }

        io.emit('chat message', msg, result.id);
        console.log('message ' + msg);
    });
    if (!socket.recovered) {
        // if the connection state recovery was not successful
        try {
            const res = await pool.query('SELECT id, content FROM messages WHERE id > $1', [socket.handshake.auth.serverOffset || 0]);
            res.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id)
            })
        }
        catch (e) {
            console.log(e)
        }
    }
});

pool.on("error", (err) => {
    console.error("Postgres error", err);
});

io.adapter(createAdapter(pool));
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});