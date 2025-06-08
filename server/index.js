import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()

await fastify.register(cors)

// 수면 기록 생성
fastify.post('/records', async (req, reply) => {
  const { startTime, endTime, note } = req.body
  const record = await prisma.sleepRecord.create({ data: { startTime, endTime, note } })
  reply.send(record)
})

// 전체 기록 조회
fastify.get('/records', async () => {
  return await prisma.sleepRecord.findMany({ orderBy: { createdAt: 'desc' } })
})

// 기록 수정
fastify.put('/records/:id', async (req, reply) => {
  const { id } = req.params
  const { startTime, endTime, note } = req.body
  const updated = await prisma.sleepRecord.update({
    where: { id: Number(id) },
    data: { startTime, endTime, note }
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
