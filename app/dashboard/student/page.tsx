'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Briefcase, FileText, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { Student, JobPost, Application } from '@/types/database'
import { COURSE_CONFIG } from '@/types/database'

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [applications, setApplications] = useState<(Application & { job_post: JobPost })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadStudentData()
    }
  }, [user, authLoading, router])

  const loadStudentData = async () => {
    if (!user) return

    try {
      // Get student profile
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()

      setStudent(studentData)

      // Get applications
      const { data: applicationsData } = await supabase
        .from('applications')
        .select(`
          *,
          job_post:job_posts(*)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Error loading student data:', error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Studente</h1>
          <p className="text-gray-600 mt-2">Gestisci il tuo profilo e le tue candidature</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick actions */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Azioni Rapide</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link href="/jobs">
                  <Button className="w-full" variant="primary">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Cerca Annunci
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

            {/* Recent applications */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Le Tue Candidature</h2>
                <Link href="/applications">
                  <Button variant="ghost" size="sm">Vedi tutte</Button>
                </Link>
              </div>

              {applications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Non hai ancora inviato candidature. <Link href="/jobs" className="text-primary hover:underline">Cerca annunci</Link>
                </p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => {
                    const StatusIcon = statusConfig[app.status].icon
                    return (
                      <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{app.job_post.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">
                              {app.job_post.type} • {app.job_post.location || 'Remoto'}
                            </p>
                            <p className="text-gray-500 text-xs mt-2">
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
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile summary */}
            <Card>
              <h2 className="text-xl font-semibold mb-4">Il Tuo Profilo</h2>
              {student && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Corso</p>
                    <p className="font-medium">{COURSE_CONFIG[student.course]?.name || student.course}</p>
                  </div>
                  {student.year && (
                    <div>
                      <p className="text-sm text-gray-600">Anno</p>
                      <p className="font-medium">{student.year}°</p>
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
                  <span className="text-gray-600">Candidature inviate</span>
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

