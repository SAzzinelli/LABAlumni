-- Fix course_type enum: replace old enum with new values
-- This migration properly replaces the old enum with the new one

-- Step 1: Create new enum type (if not exists)
DO $$ BEGIN
    CREATE TYPE course_type_new AS ENUM (
      'graphic-design-multimedia',
      'regia-videomaking',
      'fotografia',
      'fashion-design',
      'pittura',
      'design',
      'interior-design',
      'cinema-audiovisivi'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Alter students table to use TEXT temporarily
ALTER TABLE public.students 
  ALTER COLUMN course TYPE TEXT USING course::TEXT;

-- Step 3: Drop old enum type
DROP TYPE IF EXISTS course_type CASCADE;

-- Step 4: Rename new enum to course_type
ALTER TYPE course_type_new RENAME TO course_type;

-- Step 5: Update students table to use the new enum
ALTER TABLE public.students 
  ALTER COLUMN course TYPE course_type USING course::course_type;

-- Step 6: Do the same for job_posts.courses array (if column exists)
-- Check if column exists first - only alter if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_posts' 
    AND column_name = 'courses'
  ) THEN
    -- First convert to text array
    ALTER TABLE public.job_posts 
      ALTER COLUMN courses TYPE TEXT[] USING courses::TEXT[];
    
    -- Then convert back to course_type array
    ALTER TABLE public.job_posts 
      ALTER COLUMN courses TYPE course_type[] USING courses::course_type[];
  END IF;
END $$;

