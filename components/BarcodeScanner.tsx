
import React, { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Box, Button, Typography, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

type Props = {
  onDetected: (result: string) => void
  onClose?: () => void
}

const BarcodeScanner: React.FC<Props> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()
    let active = true

    const startScanner = async () => {
      try {
        const preview = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          result => {
            if (result && active) {
              onDetected(result.getText())
              if (onClose) onClose()
              active = false
              codeReader.reset()
            }
          }
        )
      } catch (err: any) {
        setError('Kamera-Zugriff fehlgeschlagen oder nicht verfügbar.')
        console.error(err)
      }
    }

    startScanner()

    return () => {
      codeReader.reset()
    }
  }, [onDetected, onClose])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        p: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'background.paper'
      }}
    >
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
      )}
      <Typography variant="h6" mb={2}>
        Barcode-Scanner
      </Typography>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <video ref={videoRef} style={{ width: '100%' }} />
      )}
    </Box>
  )
}

export default BarcodeScanner
