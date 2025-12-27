-- Add form_type column to events table for selecting which registration form to use
ALTER TABLE public.events 
ADD COLUMN form_type text DEFAULT 'normal';

-- Add a comment to describe the column
COMMENT ON COLUMN public.events.form_type IS 'Registration form type: hackathon, workshop, webinar, meetup, contest, or normal';