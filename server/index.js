import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()

fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

// 수면 기록 생성
function ensureIso8601WithSeconds(datetimeStr) {
  if (!datetimeStr) return datetimeStr
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeStr)) {
    return datetimeStr + ':00'
  }
  return datetimeStr
}

fastify.post('/records', async (req, reply) => {
  try {
    const startTimeStr = ensureIso8601WithSeconds(req.body.startTime)
    const endTimeStr = ensureIso8601WithSeconds(req.body.endTime)
    const { note } = req.body

    const record = await prisma.sleepRecord.create({
      data: {
        startTime: new Date(startTimeStr),
        endTime: new Date(endTimeStr),
        note
      }
    })
    reply.send(record)
  } catch (err) {
    console.error('POST /records 에러:', err)
    reply.status(500).send({ error: 'Failed to create record' })
  }
})

// 전체 기록 조회
fastify.get('/records', async () => {
  return await prisma.sleepRecord.findMany({ orderBy: { createdAt: 'desc' } })
})

// 기록 수정
fastify.put('/records/:id', async (req, reply) => {
  const { id } = req.params
  const startTimeStr = ensureIso8601WithSeconds(req.body.startTime)
  const endTimeStr = ensureIso8601WithSeconds(req.body.endTime)
  const { note } = req.body

  const updated = await prisma.sleepRecord.update({
    where: { id: Number(id) },
    data: {
      startTime: new Date(startTimeStr),
      endTime: new Date(endTimeStr),
      note
    }
  })
  reply.send(updated)
})

// 기록 삭제
fastify.delete('/records/:id', async (req, reply) => {
  const { id } = req.params
  await prisma.sleepRecord.delete({ where: { id: Number(id) } })
  reply.send({ deleted: true })
})

// 서버 실행
fastify.listen({ port: 3001 }, err => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('🚀 서버가 http://localhost:3001 에서 실행 중입니다.')
})
