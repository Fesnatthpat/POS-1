import { ref, onMounted, watch } from 'vue'

export interface Product {
  id: number
  name: string
  category: string
  price: number
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
  const categories = ref<string[]>(['Beverages', 'Bakery', 'Snacks', 'Main Course', 'Others'])
  const isInitialLoad = ref(true)

  const loadProducts = () => {
    if (process.client) {
      const savedProducts = localStorage.getItem('pos_products')
      if (savedProducts) products.value = JSON.parse(savedProducts)
      else {
        products.value = [
          { id: 1, name: 'Premium Coffee Beans', category: 'Beverages', price: 450, stock: 12, barcode: '885000000001', sku: 'COF-001' },
          { id: 2, name: 'Organic Green Tea', category: 'Beverages', price: 280, stock: 45, barcode: '885000000002', sku: 'TEA-001' },
          { id: 3, name: 'Artisan Sourdough', category: 'Bakery', price: 120, stock: 5, barcode: '885000000003', sku: 'BAK-001' },
          { id: 4, name: 'Dark Chocolate Bar', category: 'Snacks', price: 95, stock: 10, barcode: '885000000004', sku: 'SNA-001' },
          { id: 5, name: 'Fresh Milk', category: 'Beverages', price: 65, stock: 20, barcode: '885000000005', sku: 'BEV-001' },
          { id: 6, name: 'Blueberry Muffin', category: 'Bakery', price: 85, stock: 15, barcode: '885000000006', sku: 'BAK-002' },
        ]
      }

      const savedMovements = localStorage.getItem('pos_stock_movements')
      if (savedMovements) stockMovements.value = JSON.parse(savedMovements)

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
      note: 'Initial stock'
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
        newStock: product.stock
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
        newStock: product.stock
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
