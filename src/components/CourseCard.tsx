import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  availability: boolean;
  max_students: number;
}

interface CourseCardProps {
  course: Course;
  isApplied?: boolean;
  onApplicationChange?: () => void;
}

export default function CourseCard({ course, isApplied = false, onApplicationChange }: CourseCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to apply for courses.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('course_applications')
        .insert({
          student_id: user.id,
          course_id: course.id
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: `Your application for ${course.name} has been submitted successfully.`,
      });

      onApplicationChange?.();
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{course.name}</CardTitle>
          <Badge variant={course.availability ? "default" : "secondary"}>
            {course.availability ? "Available" : "Unavailable"}
          </Badge>
        </div>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            {course.duration}
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            Max {course.max_students} students
          </div>
        </div>
        
        {course.availability && (
          <Button 
            onClick={handleApply} 
            disabled={loading || isApplied}
            className="w-full"
          >
            {loading ? 'Applying...' : isApplied ? 'Applied' : 'Apply Now'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}