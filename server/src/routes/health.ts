import { Router, type IRouter } from 'express'
import { HealthCheckResponse } from '@workspace/api-zod'
import { checkDbHealth } from '@workspace/db'

const router: IRouter = Router()

router.get('/health', async (_req, res) => {
  const db = await checkDbHealth()
  const data = HealthCheckResponse.parse({ status: db.ok ? 'ok' : 'degraded' })
  res.json({ ...data, db })
})

export default router
