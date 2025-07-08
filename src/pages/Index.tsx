import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CourseCard from '@/components/CourseCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, User, UserCog } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  availability: boolean;
  max_students: number;
}

const Index = () => {
  const { user, userRole, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [appliedCourses, setAppliedCourses] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchUserApplications();
    }
  }, [user]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('availability', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('course_applications')
        .select('course_id')
        .eq('student_id', user.id);

      if (error) throw error;
      setAppliedCourses(data?.map(app => app.course_id) || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Student Management System</h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {userRole === 'admin' ? (
                    <Button onClick={() => window.location.href = '/admin'}>
                      <UserCog className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  ) : (
                    <Button onClick={() => window.location.href = '/dashboard'}>
                      <User className="w-4 h-4 mr-2" />
                      My Dashboard
                    </Button>
                  )}
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button onClick={() => window.location.href = '/auth'}>
                  Sign In / Sign Up
                </Button>
              )}
            </div>
          </div>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Available Courses</h2>
          <p className="text-muted-foreground">
            Explore our course catalog and apply to programs that match your interests.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No courses found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No courses are currently available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isApplied={appliedCourses.includes(course.id)}
                onApplicationChange={fetchUserApplications}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
