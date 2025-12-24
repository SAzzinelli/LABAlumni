'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase'
import { Card } from './ui/Card'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import type { Post } from '@/types/social'

interface PostCardProps {
  post: Post
  onUpdate?: () => void
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (!user || loading) return

    setLoading(true)
    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        setIsLiked(false)
        setLikesCount(prev => Math.max(0, prev - 1))
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id })
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
      onUpdate?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
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
          <div className={`grid gap-2 mb-4 ${
            post.images.length === 1 
              ? 'grid-cols-1' 
              : post.images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2'
          }`}>
            {post.images.slice(0, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Post image ${idx + 1}`}
                className={`w-full object-cover rounded-lg ${
                  post.images!.length === 1 ? 'h-96' : 'h-48'
                }`}
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
            onClick={handleLike}
            disabled={loading}
            className={`flex items-center gap-2 transition-colors ${
              isLiked 
                ? 'text-red-600' 
                : 'text-gray-600 hover:text-red-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Heart className={`w-5 h-5 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </button>
          <button className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Condividi</span>
          </button>
        </div>
      </div>
    </Card>
  )
}

