'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Briefcase, FileText, CheckCircle, Clock, XCircle, 
  Heart, MessageCircle, Share2, Plus, Image as ImageIcon,
  Users, TrendingUp, BookOpen, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import type { Student, JobPost, Application } from '@/types/database'
import type { Post } from '@/types/social'
import { COURSE_CONFIG } from '@/types/database'

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [applications, setApplications] = useState<(Application & { job_post: JobPost })[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postLoading, setPostLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadStudentData()
      loadFeedPosts()
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

  const loadFeedPosts = async () => {
    if (!user) return

    try {
      // Load posts with user info
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey(id, full_name, avatar_url, role)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Check which posts user has liked
      if (postsData) {
        const { data: likedPosts } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id))

        const likedPostIds = new Set(likedPosts?.map(l => l.post_id) || [])

        setPosts(postsData.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id)
        })) || [])
      }
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setPostLoading(false)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) return

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id })
      }

      // Reload posts
      loadFeedPosts()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'In attesa' },
    accepted: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Accettata' },
    rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Rifiutata' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 3 Column Layout */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Profile Summary Card */}
            <Card className="sticky top-24">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold">
                  {student ? (student.course?.[0]?.toUpperCase() || 'S') : 'S'}
                </div>
                <h3 className="font-semibold text-lg">{user?.email?.split('@')[0]}</h3>
                {student && (
                  <p className="text-sm text-gray-600">{COURSE_CONFIG[student.course]?.name || student.course}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Link href="/profile" className="block">
                  <Button variant="outline" className="w-full" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Visualizza Profilo
                  </Button>
                </Link>
                <Link href="/portfolio/new" className="block">
                  <Button variant="primary" className="w-full" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Lavoro
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Connessioni</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lavori</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Candidature</span>
                  <span className="font-semibold">{applications.length}</span>
                </div>
              </div>
            </Card>

            {/* Quick Links */}
            <Card>
              <h3 className="font-semibold mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-primary-600" />
                Scopri
              </h3>
              <div className="space-y-2">
                <Link href="/network" className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors py-2">
                  <Users className="w-5 h-5" />
                  <span>Network</span>
                </Link>
                <Link href="/thesis" className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors py-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Proposte Tesi</span>
                </Link>
                <Link href="/jobs" className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors py-2">
                  <Briefcase className="w-5 h-5" />
                  <span>Annunci Lavoro</span>
                </Link>
              </div>
            </Card>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-4">
            {/* Create Post Card */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Condividi un pensiero, un lavoro o una novità..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onClick={() => router.push('/post/create')}
                  />
                </div>
                <Button variant="primary" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Foto
                </Button>
              </div>
            </Card>

            {/* Feed Posts */}
            {postLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-48 bg-gray-200 rounded"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Il tuo feed è vuoto</h3>
                <p className="text-gray-600 mb-6">Inizia a seguire aziende e studenti per vedere i loro post!</p>
                <Link href="/jobs">
                  <Button variant="primary">Esplora Annunci</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Post Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {post.user?.full_name?.[0]?.toUpperCase() || post.user?.id?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{post.user?.full_name || 'Utente'}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('it-IT', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4">
                      <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
                      
                      {/* Images */}
                      {post.images && post.images.length > 0 && (
                        <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Post image ${idx + 1}`}
                              className="w-full h-64 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {/* Video */}
                      {post.video_url && (
                        <div className="mb-4">
                          <video src={post.video_url} controls className="w-full rounded-lg"></video>
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleLike(post.id, post.is_liked || false)}
                          className={`flex items-center gap-2 transition-colors ${
                            post.is_liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${post.is_liked ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">{post.likes_count}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments_count}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
                          <Share2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Condividi</span>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 space-y-6">
            {/* Recent Applications */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                  Le Tue Candidature
                </h3>
                <Link href="/applications">
                  <Button variant="ghost" size="sm">Vedi tutte</Button>
                </Link>
              </div>

              {applications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nessuna candidatura
                </p>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => {
                    const StatusIcon = statusConfig[app.status].icon
                    return (
                      <div key={app.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-medium text-sm mb-1 line-clamp-1">{app.job_post.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusIcon className={`w-4 h-4 ${statusConfig[app.status].color}`} />
                          <span className={`text-xs ${statusConfig[app.status].color}`}>
                            {statusConfig[app.status].label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Suggested Companies */}
            <Card>
              <h3 className="font-semibold mb-4">Aziende Consigliate</h3>
              <p className="text-sm text-gray-500 text-center py-4">
                Prossimamente
              </p>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}
