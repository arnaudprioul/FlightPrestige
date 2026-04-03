import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../entities/user.entity'
import { Route } from '../entities/route.entity'
import { Price } from '../entities/price.entity'
import { Alert } from '../entities/alert.entity'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306'),
  database: process.env.DB_NAME ?? 'flightprestige',
  username: process.env.DB_USER ?? 'flightprestige',
  password: process.env.DB_PASSWORD ?? 'password',
  synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Route, Price, Alert],
  migrations: [],
  charset: 'utf8mb4',
})
