import { createClient } from '@supabase/supabase-js'

// Supabase Configuration is now handled via runtimeConfig in Nuxt
const getSupabase = () => {
  const config = useRuntimeConfig()
  return createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )
}

/**
 * Compresses an image file using Canvas API
 * @param file The original File object
 * @param targetSizeKB The target size in KB
 * @param folder Folder name (products or slips)
 */
export const compressAndUpload = async (
  file: File, 
  type: 'products' | 'slips'
): Promise<string | null> => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured')
    return null
  }

  const supabase = getSupabase()

  // Define limits based on requirements
  const limits = {
    products: { min: 100, max: 200, target: 150 },
    slips: { min: 300, max: 500, target: 400 }
  }
  
  const limit = limits[type]
  
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Resize logic to stay reasonable
        const MAX_WIDTH = type === 'products' ? 800 : 1200
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH / width) * height
          width = MAX_WIDTH
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Quality adjustment loop to hit the KB target
        let quality = 0.8
        let blob: Blob | null = null
        let sizeKB = 0
        
        // Iterative compression (usually 2-3 passes)
        do {
          blob = await new Promise(resolveBlob => 
            canvas.toBlob(b => resolveBlob(b), 'image/jpeg', quality)
          )
          if (!blob) break
          sizeKB = blob.size / 1024
          
          if (sizeKB > limit.max) quality -= 0.1
          else if (sizeKB < limit.min && quality < 0.95) quality += 0.05
          else break
        } while (quality > 0.1 && (sizeKB > limit.max || sizeKB < limit.min))

        if (!blob) {
          resolve(null)
          return
        }

        // Generate filename with timestamp and random string
        const fileExt = 'jpg'
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${type}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (error) {
          console.error('Upload Error:', error.message)
          resolve(null)
          return
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)

        resolve(publicUrl)
      }
    }
  })
}
