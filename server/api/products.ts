import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { Category: true }
    })
  }

  if (method === 'POST') {
    const body = await readBody(event)
    return await prisma.product.create({
      data: {
        name: body.name,
        category: body.category,
        price: Number(body.price),
        cost: Number(body.cost),
        stock: Number(body.stock || 0),
        minStockThreshold: Number(body.minStockThreshold || 5),
        barcode: body.barcode,
        sku: body.sku,
        image: body.image,
        // Create initial movement if stock is provided
        movements: body.stock > 0 ? {
          create: {
            productName: body.name,
            type: 'In',
            quantity: Number(body.stock),
            previousStock: 0,
            newStock: Number(body.stock),
            costAtTime: Number(body.cost),
            note: 'ตั้งค่าสต็อกเริ่มต้น'
          }
        } : undefined
      }
    })
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const { id, ...updates } = body
    
    // Convert numbers if present
    if (updates.price) updates.price = Number(updates.price)
    if (updates.cost) updates.cost = Number(updates.cost)
    if (updates.stock) updates.stock = Number(updates.stock)
    if (updates.minStockThreshold) updates.minStockThreshold = Number(updates.minStockThreshold)

    return await prisma.product.update({
      where: { id: Number(id) },
      data: updates
    })
  }

  if (method === 'DELETE') {
    const query = getQuery(event)
    return await prisma.product.delete({
      where: { id: Number(query.id) }
    })
  }
})
