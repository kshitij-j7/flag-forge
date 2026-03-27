import { Pool, PoolClient } from 'pg';

export type DB = Pool | PoolClient;
