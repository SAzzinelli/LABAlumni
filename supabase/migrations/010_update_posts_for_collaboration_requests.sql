-- Update posts table to better handle collaboration requests from students
-- Students can only create posts of type 'collaboration_request'
-- Companies can create regular posts

-- Add field to distinguish collaboration requests better
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS request_type TEXT CHECK (request_type IN ('tirocinio', 'stage', 'collaborazione', 'lavoro', 'tesi')),
  ADD COLUMN IF NOT EXISTS request_courses course_type[]; -- Which courses this request is for

-- Update existing posts type constraint to include 'collaboration_request'
-- Note: We'll handle this in the application logic, keeping database flexible

-- Update RLS policy for posts - students can only create collaboration_request type posts
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;

CREATE POLICY "Companies can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'company'
    )
  );

-- New policy for students to create collaboration requests only
-- We'll enforce this in application logic, but RLS ensures user_id matches
CREATE POLICY "Students can create collaboration requests"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'student'
    )
    AND type = 'collaboration_request'
  );

