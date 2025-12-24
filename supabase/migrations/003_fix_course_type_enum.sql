-- Fix course_type enum: replace old enum with new values
-- This migration properly replaces the old enum with the new one

-- Step 1: Convert job_posts.courses to TEXT[] first (before dropping enum)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_posts' 
    AND column_name = 'courses'
  ) THEN
    ALTER TABLE public.job_posts 
      ALTER COLUMN courses TYPE TEXT[] USING courses::TEXT[];
  END IF;
END $$;

-- Step 2: Convert students.course to TEXT
ALTER TABLE public.students 
  ALTER COLUMN course TYPE TEXT USING course::TEXT;

-- Step 3: Drop old enum type
DROP TYPE IF EXISTS course_type CASCADE;

-- Step 4: Create new enum type with correct courses
CREATE TYPE course_type AS ENUM (
  'graphic-design-multimedia',
  'regia-videomaking',
  'fotografia',
  'fashion-design',
  'pittura',
  'design',
  'interior-design',
  'cinema-audiovisivi'
);

-- Step 5: Convert students.course back to new enum
ALTER TABLE public.students 
  ALTER COLUMN course TYPE course_type USING course::course_type;

-- Step 6: Convert job_posts.courses back to course_type array (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_posts' 
    AND column_name = 'courses'
  ) THEN
    ALTER TABLE public.job_posts 
      ALTER COLUMN courses TYPE course_type[] USING courses::course_type[];
  END IF;
END $$;
