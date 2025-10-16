import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL
  const password = process.env.INITIAL_ADMIN_PASSWORD
  const name = process.env.INITIAL_ADMIN_NAME || "Administrador Inicial"

  if (!email || !password) {
    throw new Error(
      "Faltan variables de entorno: establece INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD"
    )
  }

  console.log("🔐 Creación de administrador inicial (idempotente)...")

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`✅ Ya existe un usuario con email ${email}. Nada que hacer.`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  console.log("✅ Administrador creado:", user)
}

main()
  .catch((e) => {
    console.error("❌ Error al crear administrador inicial:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


