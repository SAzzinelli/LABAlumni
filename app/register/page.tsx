'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { COURSE_CONFIG, getValidYearsForCourse, type CourseType } from '@/types/database'
import Link from 'next/link'

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
}))

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [matricola, setMatricola] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [course, setCourse] = useState<CourseType>('graphic-design-multimedia')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validYears = getValidYearsForCourse(course)
  // Aggiungi opzione per 1° anno come "Auditor"
  const yearOptions = course === 'interior-design' || course === 'cinema-audiovisivi' 
    ? [1, 2]
    : [1, 2, 3] // Per triennio: 1° anno (auditor), 2° e 3° anno (normali)

  const validateStep = (step: number): boolean => {
    setError('')
    
    if (step === 1) {
      if (!firstName || !lastName || !matricola) {
        setError('Compila tutti i campi obbligatori')
        return false
      }
    }
    
    if (step === 2) {
      if (!email || !phone || !password || !confirmPassword) {
        setError('Compila tutti i campi obbligatori')
        return false
      }
      // Valida email @labafirenze.com
      if (!email.endsWith('@labafirenze.com')) {
        setError('L&apos;email deve essere del dominio @labafirenze.com')
        return false
      }
      if (password.length < 6) {
        setError('La password deve essere di almeno 6 caratteri')
        return false
      }
      if (password !== confirmPassword) {
        setError('Le password non corrispondono')
        return false
      }
    }
    
    if (step === 3) {
      if (!course || !year) {
        setError('Seleziona corso e anno di frequentazione')
        return false
      }
      // Valida che non sia 1° anno per trienni (solo auditor)
      const yearNum = parseInt(year)
      if (yearNum === 1 && (course !== 'interior-design' && course !== 'cinema-audiovisivi')) {
        // 1° anno triennio = auditor (OK, ma non può candidarsi)
      } else if (!validYears.includes(yearNum) && yearNum !== 1) {
        setError(`Per questo corso puoi registrarti al ${validYears.join('° o ')}° anno, oppure al 1° anno come Auditor`)
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep(3)) return

    setLoading(true)
    setError('')

    try {
      // Check if matricola already exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('students')
        .select('id')
        .eq('matricola', matricola)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking matricola:', checkError)
        // Continua anche se c'è errore (probabilmente Supabase non configurato)
      }

      if (existingStudent) {
        setError('Questa matricola è già registrata')
        setLoading(false)
        return
      }

      const yearNum = parseInt(year)
      const isAuditor = yearNum === 1 && (course !== 'interior-design' && course !== 'cinema-audiovisivi')

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'student',
            full_name: `${firstName} ${lastName}`,
          },
        },
      })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }
      
      if (!authData.user) {
        throw new Error('Errore nella creazione dell\'utente')
      }

      // Update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: 'student', 
          full_name: `${firstName} ${lastName}`,
          email: email
        })
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Profile error:', profileError)
        // Non blocchiamo se il profilo non esiste ancora (verrà creato da trigger)
      }

      // Create student profile
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id,
          course,
          year: yearNum,
          phone,
          matricola,
          last_year_update: new Date().toISOString(),
        })

      if (studentError) {
        console.error('Student error:', studentError)
        // Se Supabase non è configurato, mostriamo un messaggio più user-friendly
        if (studentError.message.includes('Failed to fetch') || studentError.message.includes('Network')) {
          throw new Error('Impossibile connettersi al server. Controlla la configurazione Supabase.')
        }
        throw studentError
      }

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('Registration error:', error)
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        setError('Impossibile connettersi al server. Assicurati che Supabase sia configurato correttamente.')
      } else {
        setError(error.message || 'Errore durante la registrazione')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              label="Nome"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Mario"
            />

            <Input
              label="Cognome"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Rossi"
            />

            <Input
              label="Matricola"
              type="text"
              value={matricola}
              onChange={(e) => setMatricola(e.target.value.toUpperCase())}
              required
              placeholder="ES: ABC12345"
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Input
              label="Email Accademica"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              required
              placeholder="nome.cognome@labafirenze.com"
            />
            <p className="text-sm text-gray-500 -mt-2">Solo email del dominio @labafirenze.com</p>

            <Input
              label="Telefono"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+39 123 456 7890"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimo 6 caratteri"
              minLength={6}
            />

            <Input
              label="Conferma Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Ripeti la password"
            />
          </div>
        )

      case 3:
        const yearNum = parseInt(year)
        const isAuditor = yearNum === 1 && (course !== 'interior-design' && course !== 'cinema-audiovisivi')
        
        return (
          <div className="space-y-4">
            <Select
              label="Corso di Appartenenza"
              value={course}
              onChange={(e) => {
                setCourse(e.target.value as CourseType)
                setYear('') // Reset year when course changes
              }}
              required
            >
              {COURSES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label} ({COURSE_CONFIG[c.value].type === 'triennio' ? 'Triennio' : 'Biennio'})
                </option>
              ))}
            </Select>

            <Select
              label="Anno di Frequentazione"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            >
              <option value="">Seleziona l'anno</option>
              {yearOptions.map((y) => {
                const isAuditorYear = y === 1 && (course !== 'interior-design' && course !== 'cinema-audiovisivi')
                return (
                  <option key={y} value={y}>
                    {y}° anno {isAuditorYear ? '(Auditor - solo visualizzazione)' : ''}
                  </option>
                )
              })}
            </Select>

            {isAuditor && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Registrazione come Auditor:</strong> Gli studenti del 1° anno possono registrarsi come Auditor per esplorare la piattaforma, ma non possono candidarsi alle posizioni lavorative fino al 2° anno.
                </p>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="shadow-lg">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
              Crea il tuo account
            </h1>
            <p className="text-center text-gray-600">
              Registrati come studente LABA
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={currentStep === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {renderStepContent()}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Indietro</span>
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex items-center"
                >
                  <span>Avanti</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex items-center"
                >
                  <span>{loading ? 'Registrazione in corso...' : 'Registrati'}</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Hai già un account?{' '}
              <Link href="/login" className="text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors">
                Accedi
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
