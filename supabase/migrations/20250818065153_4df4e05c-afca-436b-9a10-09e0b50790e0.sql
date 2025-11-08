-- Create user roles enum
CREATE TYPE user_role AS ENUM ('salesman', 'evaluator');

-- Create application status enum
CREATE TYPE application_status AS ENUM ('in-progress', 'submitted', 'under-review', 'approved', 'rejected');

-- Create evaluation status enum  
CREATE TYPE evaluation_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salesman_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  application_password_hash TEXT NOT NULL,
  link_token TEXT NOT NULL UNIQUE,
  status application_status NOT NULL DEFAULT 'in-progress',
  steps_completed INTEGER NOT NULL DEFAULT 0,
  
  -- Form data as JSONB
  business_info JSONB DEFAULT '{}',
  management_ownership JSONB DEFAULT '[]',
  principals JSONB DEFAULT '[]',
  bank_info JSONB DEFAULT '{}',
  financial_request JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evaluations table
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluator_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  underwriting_status evaluation_status DEFAULT 'pending',
  underwriting_notes TEXT DEFAULT '',
  
  kyc_status evaluation_status DEFAULT 'pending',
  kyc_notes TEXT DEFAULT '',
  
  aml_status evaluation_status DEFAULT 'pending',
  aml_notes TEXT DEFAULT '',
  
  risk_assessment_status evaluation_status DEFAULT 'pending',
  risk_assessment_notes TEXT DEFAULT '',
  
  overall_status evaluation_status DEFAULT 'pending',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(application_id) -- One evaluation per application
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for applications
CREATE POLICY "Salesmen can view their applications" 
ON public.applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'salesman' 
    AND profiles.user_id = applications.salesman_id
  )
);

CREATE POLICY "Evaluators can view submitted applications" 
ON public.applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'evaluator'
  ) 
  AND status IN ('submitted', 'under-review', 'approved', 'rejected')
);

CREATE POLICY "Salesmen can create applications" 
ON public.applications FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'salesman' 
    AND profiles.user_id = salesman_id
  )
);

CREATE POLICY "Salesmen can update their applications" 
ON public.applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'salesman' 
    AND profiles.user_id = applications.salesman_id
  )
);

-- Public access for client application updates via link_token
CREATE POLICY "Public can update applications via link_token" 
ON public.applications FOR UPDATE 
USING (true);

-- RLS Policies for evaluations
CREATE POLICY "Evaluators can view all evaluations" 
ON public.evaluations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'evaluator'
  )
);

CREATE POLICY "Evaluators can create evaluations" 
ON public.evaluations FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'evaluator' 
    AND profiles.user_id = evaluator_id
  )
);

CREATE POLICY "Evaluators can update their evaluations" 
ON public.evaluations FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'evaluator' 
    AND profiles.user_id = evaluations.evaluator_id
  )
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'salesman')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();