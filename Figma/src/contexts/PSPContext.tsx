import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface PSPConfig {
  id: string
  name: string
  commissionRate: number // Stored as decimal (0.05 = 5%)
  isActive: boolean
}

interface PSPContextType {
  psps: PSPConfig[]
  setPsps: React.Dispatch<React.SetStateAction<PSPConfig[]>>
  getActivePsps: () => PSPConfig[]
  getPspByName: (name: string) => PSPConfig | undefined
  addPsp: (psp: Omit<PSPConfig, 'id'>) => void
  updatePsp: (id: string, updates: Partial<PSPConfig>) => void
  removePsp: (id: string) => void
  togglePspStatus: (id: string) => void
}

const PSPContext = createContext<PSPContextType | undefined>(undefined)

// Initial PSP configuration with your provided rates
const initialPsps: PSPConfig[] = [
  { id: '1', name: 'CPO PY KK', commissionRate: 0.11, isActive: true },
  { id: '2', name: 'CPO', commissionRate: 0.05, isActive: true },
  { id: '3', name: 'ATATP', commissionRate: 0.08, isActive: true },
  { id: '4', name: 'SİPAY', commissionRate: 0.12, isActive: true },
  { id: '5', name: 'FILBOX KK', commissionRate: 0.12, isActive: true },
  { id: '6', name: '#61 CRYPPAY', commissionRate: 0.075, isActive: true },
  { id: '7', name: '#60 CASHPAY', commissionRate: 0.08, isActive: true },
  { id: '8', name: 'TETHER', commissionRate: 0, isActive: true },
  { id: '9', name: 'KUYUMCU', commissionRate: 0.12, isActive: true }
]

export function PSPProvider({ children }: { children: ReactNode }) {
  const [psps, setPsps] = useState<PSPConfig[]>(initialPsps)

  const getActivePsps = () => {
    return psps.filter(psp => psp.isActive)
  }

  const getPspByName = (name: string) => {
    return psps.find(psp => psp.name === name)
  }

  const addPsp = (pspData: Omit<PSPConfig, 'id'>) => {
    const newPsp: PSPConfig = {
      ...pspData,
      id: Date.now().toString()
    }
    setPsps(prev => [...prev, newPsp])
  }

  const updatePsp = (id: string, updates: Partial<PSPConfig>) => {
    setPsps(prev => prev.map(psp => 
      psp.id === id ? { ...psp, ...updates } : psp
    ))
  }

  const removePsp = (id: string) => {
    setPsps(prev => prev.filter(psp => psp.id !== id))
  }

  const togglePspStatus = (id: string) => {
    setPsps(prev => prev.map(psp => 
      psp.id === id ? { ...psp, isActive: !psp.isActive } : psp
    ))
  }

  return (
    <PSPContext.Provider value={{
      psps,
      setPsps,
      getActivePsps,
      getPspByName,
      addPsp,
      updatePsp,
      removePsp,
      togglePspStatus
    }}>
      {children}
    </PSPContext.Provider>
  )
}

export function usePSP() {
  const context = useContext(PSPContext)
  if (context === undefined) {
    throw new Error('usePSP must be used within a PSPProvider')
  }
  return context
}