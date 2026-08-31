import { useEffect, useRef } from 'react'
import QRCodeStyling, { type Options } from 'qr-code-styling'
import { debounce } from 'throttle-debounce'
import { generateOption } from './method'

export type TQrcodeProps = {
  width?: number
  height?: number
  image?: string
  value?: string
  dotsOptions?: Options['dotsOptions']
  className?: string
}

const defaultDots: Options['dotsOptions'] = { color: '#41b583', type: 'rounded' }

export default function QrCode({ width = 300, height = 300, image, value, dotsOptions = defaultDots, className }: TQrcodeProps) {
  const domRef = useRef<HTMLDivElement | null>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const propsRef = useRef({ width, height, image, value, dotsOptions })
  propsRef.current = { width, height, image, value, dotsOptions }

  const renderRef = useRef(
    debounce(300, false, () => {
      const qrCode = qrCodeRef.current
      if (!qrCode) return
      const options = generateOption(propsRef.current)
      if (propsRef.current.value) {
        options && qrCode.update(options)
        requestAnimationFrame(() => {
          const first = domRef.current?.firstChild as HTMLElement | null
          if (!first) return
          first.setAttribute('style', 'width: 100%;')
        })
      }
    }),
  )

  useEffect(() => {
    qrCodeRef.current = new QRCodeStyling({})
    renderRef.current()
    domRef.current && qrCodeRef.current.append(domRef.current)
  }, [])

  useEffect(() => {
    renderRef.current()
  }, [width, height, image, value, dotsOptions])

  return <div ref={domRef} className={className ? `qrcode__wrap ${className}` : 'qrcode__wrap'} />
}
