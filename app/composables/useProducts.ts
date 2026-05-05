import { ref, onMounted, watch } from 'vue'

export interface Product {
  id: number
  name: string
  category: string
  price: number
  cost: number
  stock: number
  barcode?: string
  sku?: string
  image?: string
}

export interface StockMovement {
  id: number
  productId: number
  productName: string
  type: 'In' | 'Out' | 'Sale' | 'Adjustment'
  quantity: number
  previousStock: number
  newStock: number
  timestamp: string
  note?: string
}

export const useProducts = () => {
  const products = ref<Product[]>([])
  const stockMovements = ref<StockMovement[]>([])
  const categories = ref<string[]>(['เครื่องดื่ม', 'เบเกอรี่', 'ของว่าง', 'อาหารจานหลัก', 'อื่นๆ'])
  const isInitialLoad = ref(true)

  const loadProducts = () => {
    if (process.client) {
      const savedProducts = localStorage.getItem('pos_products')
      if (savedProducts) products.value = JSON.parse(savedProducts)
      else {
        products.value = [
          { id: 1, name: 'เอสเพรสโซ่ พรีเมียม', category: 'เครื่องดื่ม', cost: 25, price: 65, stock: 45, barcode: '885000000001', sku: 'COF-001' },
          { id: 2, name: 'ชาเขียวลาเต้เย็น', category: 'เครื่องดื่ม', cost: 30, price: 75, stock: 32, barcode: '885000000002', sku: 'TEA-001' },
          { id: 3, name: 'ครัวซองต์เนยสด', category: 'เบเกอรี่', cost: 18, price: 45, stock: 12, barcode: '885000000003', sku: 'BAK-001' },
          { id: 4, name: 'มัฟฟินช็อกโกแลต', category: 'เบเกอรี่', cost: 22, price: 55, stock: 8, barcode: '885000000004', sku: 'BAK-002' },
          { id: 5, name: 'แซนวิชแฮมชีส', category: 'ของว่าง', cost: 35, price: 85, stock: 4, barcode: '885000000005', sku: 'SNA-001' },
          { id: 6, name: 'สปาเก็ตตี้คาโบนาร่า', category: 'อาหารจานหลัก', cost: 65, price: 159, stock: 15, barcode: '885000000006', sku: 'MAIN-001' },
          { id: 7, name: 'คาราเมลมัคคิอาโต้', category: 'เครื่องดื่ม', cost: 35, price: 85, stock: 0, barcode: '885000000007', sku: 'COF-002' },
          { id: 8, name: 'บลูเบอร์รี่ชีสเค้ก', category: 'เบเกอรี่', cost: 45, price: 110, stock: 6, barcode: '885000000008', sku: 'BAK-003' },
          { id: 9, name: 'มันฝรั่งทอด (รสเกลือ)', category: 'ของว่าง', cost: 15, price: 35, stock: 50, barcode: '885000000009', sku: 'SNA-002' },
          { id: 10, name: 'น้ำเปล่า 500มล.', category: 'เครื่องดื่ม', cost: 5, price: 15, stock: 120, barcode: '885000000010', sku: 'BEV-001' },
        ]
      }

      const savedMovements = localStorage.getItem('pos_stock_movements')
      if (savedMovements) stockMovements.value = JSON.parse(savedMovements)
      else {
        // Initial movements for mock products
        stockMovements.value = products.value.map(p => ({
          id: Date.now() - Math.random() * 1000000,
          productId: p.id,
          productName: p.name,
          type: 'In',
          quantity: p.stock,
          previousStock: 0,
          newStock: p.stock,
          timestamp: new Date().toISOString(),
          note: 'ตั้งค่าสต็อกเริ่มต้น'
        }))
      }

      isInitialLoad.value = false
    }
  }

  const saveProducts = () => {
    if (process.client) {
      localStorage.setItem('pos_products', JSON.stringify(products.value))
      localStorage.setItem('pos_stock_movements', JSON.stringify(stockMovements.value))
    }
  }

  const addMovement = (movement: Omit<StockMovement, 'id' | 'timestamp'>) => {
    stockMovements.value.push({
      ...movement,
      id: Date.now(),
      timestamp: new Date().toISOString()
    })
  }

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: Date.now() }
    products.value.push(newProduct)
    addMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'In',
      quantity: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      note: 'เพิ่มสินค้าใหม่'
    })
    saveProducts()
  }

  const updateProduct = (id: number, updates: Partial<Product>) => {
    const index = products.value.findIndex(p => p.id === id)
    if (index !== -1) {
      products.value[index] = { ...products.value[index], ...updates }
      saveProducts()
    }
  }

  const deleteProduct = (id: number) => {
    products.value = products.value.filter(p => p.id !== id)
    saveProducts()
  }

  const deductStock = (productId: number, quantity: number, type: 'Sale' | 'Adjustment' = 'Sale') => {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      const prev = product.stock
      product.stock = Math.max(0, product.stock - quantity)
      addMovement({
        productId,
        productName: product.name,
        type,
        quantity: -quantity,
        previousStock: prev,
        newStock: product.stock,
        note: type === 'Sale' ? 'รายการขายหน้าร้าน' : 'ปรับปรุงสต็อกสินค้า'
      })
      saveProducts()
    }
  }

  const addStock = (productId: number, quantity: number) => {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      const prev = product.stock
      product.stock += quantity
      addMovement({
        productId,
        productName: product.name,
        type: 'In',
        quantity,
        previousStock: prev,
        newStock: product.stock,
        note: 'เติมสต็อกสินค้า'
      })
      saveProducts()
    }
  }

  watch(products, () => {
    if (!isInitialLoad.value) saveProducts()
  }, { deep: true })

  onMounted(() => {
    loadProducts()
  })

  return {
    products,
    stockMovements,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    deductStock,
    addStock
  }
}
