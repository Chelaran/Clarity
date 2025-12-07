"use client"

import { useState, useRef } from "react"
import { Scanner } from "@yudiel/react-qr-scanner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Loader2, CheckCircle2, Image as ImageIcon, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiUrl } from "@/lib/api"
import { useRefresh } from "@/components/refresh-context" 
import jsQR from "jsqr"
import { cn } from "@/lib/utils"

interface ReceiptQrScannerProps {
  className?: string
}

export function ReceiptQrScanner({ className }: ReceiptQrScannerProps) {
  const { token } = useAuth()
  const { triggerRefresh } = useRefresh()
  
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState("")
  const [isError, setIsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- 1. ЛОГИКА ПАРСИНГА ---
  // Превращает строку вида t=20231025T1630&s=500.00 в объект { amount: 500, date: "2023-10-25" }
  const parseRussianQr = (qrString: string) => {
    try {
      // console.log("Raw QR String:", qrString) // Для отладки
      
      // Ищем сумму (s=...)
      const sumMatch = qrString.match(/s=([0-9]+\.[0-9]+|[0-9]+)/)
      const amount = sumMatch ? parseFloat(sumMatch[1]) : null
      
      // Ищем дату (t=YYYYMMDDTHHMM...)
      const dateMatch = qrString.match(/t=([0-9]{8}T[0-9]{4,6})/)
      let date = new Date().toISOString().split('T')[0]
      
      if (dateMatch) {
        const rawDate = dateMatch[1]
        const year = rawDate.substring(0, 4)
        const month = rawDate.substring(4, 6)
        const day = rawDate.substring(6, 8)
        date = `${year}-${month}-${day}`
      }
      return { amount, date }
    } catch (e) {
      console.error(e)
      return { amount: null, date: null }
    }
  }

  // --- 2. ОТПРАВКА НА СЕРВЕР ---
  const processQrString = async (rawValue: string) => {
    if (!token) return

    // Проверка: это вообще чек?
    if (!rawValue.includes("t=") || !rawValue.includes("s=")) {
      setStatus("QR не содержит данных чека")
      setIsError(true)
      // Не закрываем сразу, даем прочитать ошибку
      setIsLoading(false) 
      return
    }

    setIsLoading(true)
    setIsError(false)
    setStatus("Сохранение...")

    try {
      const { amount, date } = parseRussianQr(rawValue)
      if (!amount) throw new Error("Сумма не найдена")

      const response = await fetch(apiUrl("/transactions"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: -Math.abs(amount), // Расход всегда с минусом
          description: "Покупка (QR)",
          type: "expense",
          date: date,
          category: "Shopping", // Временная категория, ML может уточнить позже
          is_essential: false,
          ref_no: `QR-${Date.now()}`
        })
      })

      if (!response.ok) throw new Error("Ошибка API")

      // Успех
      triggerRefresh()
      setStatus(`Успешно! -${amount} ₽`)
      setIsError(false)
      
      // Закрываем модалку через 1.5 сек
      setTimeout(() => {
        setIsOpen(false)
        setStatus("")
        setIsLoading(false)
      }, 1500)

    } catch (error) {
      console.error(error)
      setStatus("Ошибка обработки")
      setIsError(true)
      setIsLoading(false)
    }
  }

  // --- 3. ОБРАБОТКА КАМЕРЫ ---
  const handleCameraScan = (result: any) => {
    if (isLoading) return
    // Библиотека может вернуть массив или объект
    const rawValue = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue
    if (rawValue) processQrString(rawValue)
  }

  // --- 4. ОБРАБОТКА ФАЙЛА (СЖАТИЕ И ЧТЕНИЕ) ---
  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setIsError(false)
    setStatus("Анализ фото...")

    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        
        // ! ВАЖНО: Сжимаем картинку до 800px !
        // jsQR плохо работает с большими фото (4000x3000), нужно уменьшать
        const MAX_WIDTH = 800
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
        
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        if (context) {
          context.drawImage(img, 0, 0, canvas.width, canvas.height)
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          
          // Ищем QR на уменьшенной картинке
          const code = jsQR(imageData.data, imageData.width, imageData.height)

          if (code) {
            processQrString(code.data)
          } else {
            setStatus("QR код не найден на фото")
            setIsError(true)
            setIsLoading(false)
          }
        }
      }
      
      img.onerror = () => {
        setStatus("Ошибка чтения файла")
        setIsError(true)
        setIsLoading(false)
      }
      
      img.src = event.target?.result as string
    }
    
    reader.readAsDataURL(file)
    e.target.value = "" // Сброс инпута, чтобы можно было выбрать тот же файл
  }

  return (
    <>
      {/* Кнопка вызова (стилизована под список меню) */}
      <Button 
        variant="outline" 
        // cn объединит дефолтные классы и те, что пришли сверху
        className={cn("gap-2", className)} 
        onClick={() => {
            setIsOpen(true)
            setStatus("")
            setIsError(false)
            setIsLoading(false)
        }}
      >
        <QrCode className="w-4 h-4" /> {/* Иконка всегда есть */}
        <span className="hidden sm:inline">Скан QR</span> {/* Текст скрываем на совсем узких экранах, если надо */}
        <span className="sm:hidden">QR</span>
      </Button>

      {/* Модальное окно */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90%] sm:max-w-[400px] p-0 overflow-hidden bg-background rounded-xl gap-0 border border-border">
          
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="text-center">Сканирование чека</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col">
            {/* Зона камеры / Статуса */}
            <div className="relative w-full aspect-square bg-neutral-900 overflow-hidden">
              
              {/* Если ничего не грузится и нет статуса - показываем камеру */}
              {!isLoading && !status ? (
                <Scanner 
                  onScan={handleCameraScan}
                  components={{ audio: false, onOff: false, torch: true, finder: false }}
                  styles={{ container: { width: "100%", height: "100%" } }}
                />
              ) : (
                // Экран статуса (поверх камеры)
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-20 p-6 text-center animate-in fade-in">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Обработка...</p>
                    </>
                  ) : isError ? (
                    <>
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <p className="font-medium text-red-600 mb-4">{status}</p>
                      <Button variant="outline" size="sm" onClick={() => {
                          setStatus("")
                          setIsError(false)
                      }}>
                        Попробовать снова
                      </Button>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                      <p className="font-medium text-lg text-green-600">{status}</p>
                    </>
                  )}
                </div>
              )}
              
              {/* Рамка прицела (только когда активна камера) */}
              {!isLoading && !status && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Нижняя панель с кнопкой загрузки */}
            <div className="p-4 flex flex-col gap-3 bg-background">
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
                disabled={isLoading && !isError} // Блокируем только если идет загрузка, но при ошибке даем нажать снова
              >
                <ImageIcon className="w-4 h-4" />
                Загрузить фото из галереи
              </Button>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileScan} 
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}