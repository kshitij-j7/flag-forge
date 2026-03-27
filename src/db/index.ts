import { Pool } from "pg";
import { DATABASE_URL } from "../config/db.js";

export const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false, // important for local
});
