'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import type { Student, Company, Profile, CourseType } from '@/types/database'

import { COURSE_CONFIG } from '@/types/database'

const COURSES = Object.entries(COURSE_CONFIG).map(([value, config]) => ({
  value: value as CourseType,
  label: config.name,
}))

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [course, setCourse] = useState<CourseType>('graphic-design-multimedia')
  const [year, setYear] = useState('')
  const [phone, setPhone] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyDescription, setCompanyDescription] = useState('')
  const [industry, setIndustry] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadProfile()
    }
  }, [user, authLoading, router])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setFullName(profileData?.full_name || '')

      if (profileData?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()

        setStudent(studentData)
        if (studentData) {
          setBio(studentData.bio || '')
          setCourse(studentData.course)
          setYear(studentData.year?.toString() || '')
          setPhone(studentData.phone || '')
          setPortfolioUrl(studentData.portfolio_url || '')
          setTwitterUrl(studentData.twitter_url || '')
          setLinkedinUrl(studentData.linkedin_url || '')
          setWebsiteUrl(studentData.website_url || '')
        }
      } else {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', user.id)
          .single()

        setCompany(companyData)
        if (companyData) {
          setCompanyName(companyData.company_name || '')
          setCompanyDescription(companyData.description || '')
          setIndustry(companyData.industry || '')
          setWebsiteUrl(companyData.website_url || '')
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      // Update student or company
      if (profile?.role === 'student') {
        await supabase
          .from('students')
          .update({
            bio,
            course,
            year: year ? parseInt(year) : null,
            phone: phone || null,
            portfolio_url: portfolioUrl || null,
            twitter_url: twitterUrl || null,
            linkedin_url: linkedinUrl || null,
            website_url: websiteUrl || null,
          })
          .eq('id', user.id)
      } else {
        await supabase
          .from('companies')
          .update({
            company_name: companyName,
            description: companyDescription || null,
            industry: industry || null,
            website_url: websiteUrl || null,
          })
          .eq('id', user.id)
      }

      alert('Profilo aggiornato con successo!')
      loadProfile()
    } catch (error: any) {
      alert(error.message || 'Errore durante il salvataggio')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Il Tuo Profilo</h1>

        <Card>
          <h2 className="text-xl font-semibold mb-6">Informazioni Personali</h2>
          
          <div className="space-y-4">
            <Input
              label="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            {profile?.role === 'student' ? (
              <>
                <Select
                  label="Corso"
                  value={course}
                  onChange={(e) => setCourse(e.target.value as CourseType)}
                >
                  {COURSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Anno"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="1, 2, 3..."
                  disabled
                />
                <p className="text-xs text-gray-500 -mt-2 mb-2">
                  L&apos;anno viene aggiornato automaticamente ogni 1 ottobre
                </p>

                <Input
                  label="Telefono"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
                />

                <Textarea
                  label="Bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Racconta qualcosa di te..."
                />

                <Input
                  label="Portfolio URL"
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://..."
                />

                <Input
                  label="Twitter/X URL"
                  type="url"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                />

                <Input
                  label="LinkedIn URL"
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />

                <Input
                  label="Sito Web Personale"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                />
              </>
            ) : (
              <>
                <Input
                  label="Nome Azienda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />

                <Textarea
                  label="Descrizione Azienda"
                  rows={4}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Descrivi la tua azienda..."
                />

                <Input
                  label="Settore"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="Es: Design, Marketing, Tecnologia..."
                />

                <Input
                  label="Sito Web Aziendale"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                />
              </>
            )}

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

