'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, Users, FileText, Plus, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { Company, JobPost, Application } from '@/types/database'

export default function CompanyDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<(Application & { student: any; job_post: JobPost })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadCompanyData()
    }
  }, [user, authLoading, router])

  const loadCompanyData = async () => {
    if (!user) return

    try {
      // Get company profile
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', user.id)
        .single()

      setCompany(companyData)

      // Get job posts
      const { data: jobsData } = await supabase
        .from('job_posts')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setJobPosts(jobsData || [])

      // Get recent applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*),
          student:students(id, course)
        `)
        .in('job_post_id', jobsData?.map(j => j.id) || [])
        .order('created_at', { ascending: false })
        .limit(5)

      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Error loading company data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)

    if (!error) {
      loadCompanyData()
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'In attesa' },
    accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Accettata' },
    rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rifiutata' },
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Azienda</h1>
          <p className="text-gray-600 mt-2">
            Benvenuto{company?.company_name ? `, ${company.company_name}` : ''}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Azioni Rapide</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/jobs/manage">
                  <Button className="w-full" variant="primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Nuovo Annuncio
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button className="w-full" variant="outline">
                    <FileText className="w-5 h-5 mr-2" />
                    Modifica Profilo
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Job posts */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">I Tuoi Annunci</h2>
                <Link href="/jobs/manage">
                  <Button variant="ghost" size="sm">Gestisci</Button>
                </Link>
              </div>

              {jobPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Non hai ancora creato annunci. <Link href="/jobs/manage" className="text-primary hover:underline">Crea il primo annuncio</Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {jobPosts.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            {!job.active && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inattivo</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {job.type} • {job.location || 'Remoto'}
                          </p>
                          <p className="text-gray-500 text-xs mt-2">
                            Pubblicato il {new Date(job.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent applications */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Candidature Recenti</h2>
                <Link href="/applications/manage">
                  <Button variant="ghost" size="sm">Vedi tutte</Button>
                </Link>
              </div>

              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nessuna candidatura ricevuta ancora.
                </p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const StatusIcon = statusConfig[app.status].icon
                    return (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">{app.job_post.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              Candidato il {new Date(app.created_at).toLocaleDateString('it-IT')}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig[app.status].bg}`}>
                            <StatusIcon className={`w-4 h-4 ${statusConfig[app.status].color}`} />
                            <span className={`text-sm font-medium ${statusConfig[app.status].color}`}>
                              {statusConfig[app.status].label}
                            </span>
                          </div>
                        </div>
                        
                        {app.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleApplicationStatus(app.id, 'accepted')}
                            >
                              Accetta
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplicationStatus(app.id, 'rejected')}
                            >
                              Rifiuta
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company info */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">La Tua Azienda</h2>
              {company && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium">{company.company_name}</p>
                  </div>
                  {company.industry && (
                    <div>
                      <p className="text-sm text-gray-600">Settore</p>
                      <p className="font-medium">{company.industry}</p>
                    </div>
                  )}
                  <Link href="/profile">
                    <Button variant="outline" className="w-full" size="sm">
                      Completa Profilo
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* Stats */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Statistiche</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annunci attivi</span>
                  <span className="font-semibold">
                    {jobPosts.filter(j => j.active).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Candidature totali</span>
                  <span className="font-semibold">{applications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">In attesa</span>
                  <span className="font-semibold text-yellow-600">
                    {applications.filter(a => a.status === 'pending').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accettate</span>
                  <span className="font-semibold text-green-600">
                    {applications.filter(a => a.status === 'accepted').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}


