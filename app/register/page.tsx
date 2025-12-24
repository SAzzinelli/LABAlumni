'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { CheckCircle, ArrowRight, ArrowLeft, User, GraduationCap, Phone, Lock } from 'lucide-react'
import { COURSE_CONFIG, getValidYearsForCourse, type CourseType } from '@/types/database'
import Link from 'next/link'

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
}))

const STEPS = [
  { id: 1, title: 'Credenziali', icon: User },
  { id: 2, title: 'Informazioni Personali', icon: GraduationCap },
  { id: 3, title: 'Corso di Studio', icon: GraduationCap },
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [matricola, setMatricola] = useState('')
  const [course, setCourse] = useState<CourseType>('graphic-design-multimedia')
  const [year, setYear] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validYears = getValidYearsForCourse(course)

  const validateStep = (step: number): boolean => {
    setError('')
    
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError('Compila tutti i campi obbligatori')
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
    
    if (step === 2) {
      if (!fullName || !phone || !matricola) {
        setError('Compila tutti i campi obbligatori')
        return false
      }
    }
    
    if (step === 3) {
      if (!course || !year) {
        setError('Seleziona corso e anno di frequentazione')
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
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('matricola', matricola)
        .single()

      if (existingStudent) {
        setError('Questa matricola è già registrata')
        setLoading(false)
        return
      }

      // Validate year based on course
      const yearNum = parseInt(year)
      if (!validYears.includes(yearNum)) {
        setError(`Per questo corso puoi registrarti solo al ${validYears.join('° o ')}° anno`)
        setLoading(false)
        return
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'student',
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Errore nella creazione dell&apos;utente')

      // Update profile with role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'student', full_name: fullName })
        .eq('id', authData.user.id)

      if (profileError) throw profileError

      // Create student profile
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          id: authData.user.id,
          course,
          year: parseInt(year),
          phone,
          matricola,
          last_year_update: new Date().toISOString(),
        })

      if (studentError) throw studentError

      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Errore durante la registrazione')
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Credenziali di Accesso</h2>
              <p className="text-gray-600 mt-2">Crea il tuo account per iniziare</p>
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tuo@email.com"
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

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Informazioni Personali</h2>
              <p className="text-gray-600 mt-2">Inserisci i tuoi dati anagrafici</p>
            </div>

            <Input
              label="Nome e Cognome"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Mario Rossi"
            />

            <Input
              label="Telefono"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="+39 123 456 7890"
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

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <GraduationCap className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Corso di Studio</h2>
              <p className="text-gray-600 mt-2">Seleziona il tuo corso e anno di frequentazione</p>
            </div>

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
              label={`Anno di Frequentazione (${COURSE_CONFIG[course].type === 'triennio' ? 'Solo 2° e 3° anno' : 'Solo 1° e 2° anno'})`}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            >
              <option value="">Seleziona l&apos;anno</option>
              {validYears.map((y) => (
                <option key={y} value={y}>
                  {y}° anno
                </option>
              ))}
            </Select>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
              Registrati come Studente
            </h1>
            <p className="text-center text-gray-600">
              Completa i seguenti passaggi per creare il tuo account
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : isCurrent
                            ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100'
                            : 'bg-white border-gray-300 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-6 h-6" />
                        )}
                      </div>
                      <span
                        className={`mt-2 text-sm font-medium ${
                          isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-4 transition-colors ${
                          isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm animate-slide-up">
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
                Indietro
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex items-center"
                >
                  Avanti
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex items-center"
                >
                  {loading ? 'Registrazione in corso...' : 'Completa Registrazione'}
                  <CheckCircle className="w-4 h-4 ml-2" />
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
