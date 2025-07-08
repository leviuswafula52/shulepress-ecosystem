import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Users, BookOpen, Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Student {
  id: string;
  email: string;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string;
  };
}

interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  availability: boolean;
  max_students: number;
}

interface Application {
  id: string;
  status: string;
  applied_at: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  courses: {
    name: string;
  };
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    duration: '',
    availability: true,
    max_students: 50
  });
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchStudents(),
      fetchCourses(),
      fetchApplications()
    ]);
    setLoading(false);
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          user_id
        `);

      if (error) throw error;

      // Get user emails from auth
      const studentData = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: userData } = await supabase.auth.admin.getUserById(profile.user_id);
          return {
            id: profile.user_id,
            email: userData.user?.email || '',
            profiles: {
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || ''
            }
          };
        })
      );

      setStudents(studentData);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('course_applications')
        .select(`
          id,
          status,
          applied_at,
          student_id,
          courses (
            name
          )
        `)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      // Fetch profile data separately for each application
      const applicationsWithProfiles = await Promise.all(
        (data || []).map(async (app) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', app.student_id)
            .single();

          return {
            ...app,
            profiles: profileData || { first_name: '', last_name: '' }
          };
        })
      );

      setApplications(applicationsWithProfiles);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const createCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('courses')
        .insert(newCourse);

      if (error) throw error;

      toast({
        title: "Course Created",
        description: "New course has been added successfully.",
      });

      setNewCourse({
        name: '',
        description: '',
        duration: '',
        availability: true,
        max_students: 50
      });

      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateCourse = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          name: course.name,
          description: course.description,
          duration: course.duration,
          availability: course.availability,
          max_students: course.max_students
        })
        .eq('id', course.id);

      if (error) throw error;

      toast({
        title: "Course Updated",
        description: "Course has been updated successfully.",
      });

      setEditingCourse(null);
      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "Course Deleted",
        description: "Course has been deleted successfully.",
      });

      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('course_applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Application Updated",
        description: `Application has been ${status}.`,
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {applications.filter(app => app.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Registered Students</CardTitle>
                <CardDescription>Manage student accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">
                          {student.profiles.first_name} {student.profiles.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.profiles.phone && (
                          <p className="text-sm text-muted-foreground">{student.profiles.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Management</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>Create a new course for students to apply to.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createCourse} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Course Name</Label>
                      <Input
                        id="name"
                        value={newCourse.name}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCourse.description}
                        onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          value={newCourse.duration}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 12 weeks"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxStudents">Max Students</Label>
                        <Input
                          id="maxStudents"
                          type="number"
                          value={newCourse.max_students}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, max_students: parseInt(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="availability"
                        checked={newCourse.availability}
                        onCheckedChange={(checked) => setNewCourse(prev => ({ ...prev, availability: checked }))}
                      />
                      <Label htmlFor="availability">Course Available</Label>
                    </div>
                    <Button type="submit" className="w-full">Create Course</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {courses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{course.name}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={course.availability ? "default" : "secondary"}>
                          {course.availability ? "Available" : "Unavailable"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCourse(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Duration: {course.duration} | Max Students: {course.max_students}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle>Course Applications</CardTitle>
                <CardDescription>Review and manage student applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">
                          {application.profiles.first_name} {application.profiles.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Applied for: {application.courses.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied on: {new Date(application.applied_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          application.status === 'approved' ? 'default' :
                          application.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                        {application.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateApplicationStatus(application.id, 'approved')}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateApplicationStatus(application.id, 'rejected')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editingCourse && (
          <Dialog open={!!editingCourse} onOpenChange={() => setEditingCourse(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Course</DialogTitle>
                <DialogDescription>Update course information.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); updateCourse(editingCourse); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Course Name</Label>
                  <Input
                    id="editName"
                    value={editingCourse.name}
                    onChange={(e) => setEditingCourse(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editingCourse.description}
                    onChange={(e) => setEditingCourse(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editDuration">Duration</Label>
                    <Input
                      id="editDuration"
                      value={editingCourse.duration}
                      onChange={(e) => setEditingCourse(prev => prev ? ({ ...prev, duration: e.target.value }) : null)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMaxStudents">Max Students</Label>
                    <Input
                      id="editMaxStudents"
                      type="number"
                      value={editingCourse.max_students}
                      onChange={(e) => setEditingCourse(prev => prev ? ({ ...prev, max_students: parseInt(e.target.value) }) : null)}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editAvailability"
                    checked={editingCourse.availability}
                    onCheckedChange={(checked) => setEditingCourse(prev => prev ? ({ ...prev, availability: checked }) : null)}
                  />
                  <Label htmlFor="editAvailability">Course Available</Label>
                </div>
                <Button type="submit" className="w-full">Update Course</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}