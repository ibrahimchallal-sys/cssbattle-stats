import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FloatingShape from "@/components/FloatingShape";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  Trash2,
  Trophy,
  BookOpen,
  PlusCircle,
  RefreshCw,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { Badge } from "@/components/ui/badge";

interface QuizScore {
  id: string;
  player_id: string;
  score: number;
  total_questions: number;
  completed_at: string;
  quiz_title: string;
  players: {
    full_name: string;
    email: string;
    group_name: string | null;
  };
}

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "doc" | "link" | "video";
  created_at: string;
  file_data?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
}

const AdminLearningManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { admin, isAdmin, loading: adminLoading } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [quizScores, setQuizScores] = useState<QuizScore[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [showAddResource, setShowAddResource] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    type: "link" as "pdf" | "doc" | "link" | "video",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Calculate statistics
  const totalQuizScores = quizScores.length;
  const totalResources = resources.length;
  const averageScore = quizScores.length > 0 
    ? quizScores.reduce((sum, score) => sum + score.score, 0) / quizScores.length
    : 0;

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchQuizScores(), fetchResources()]);
    setLoading(false);
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQuizScores();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, adminLoading, navigate]);

  const fetchQuizScores = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select(
          `
          *,
          players (
            full_name,
            email,
            group_name
          )
        `
        )
        .order("completed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setQuizScores(data || []);
    } catch (error) {
      console.error("Failed to fetch quiz scores:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz scores",
        variant: "destructive",
      });
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("learning_resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources((data as LearningResource[]) || []);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !admin) {
      console.log("No file selected or no admin user");
      return null;
    }

    // Check file size (limit to 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size exceeds 50MB limit",
        variant: "destructive",
      });
      return null;
    }

    try {
      setUploadingFile(true);
      
      // Convert file to base64 for database storage
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile); // This will create a data URL with base64 encoding
      });

      // Extract base64 data (remove the data URL prefix)
      const base64Data = fileData.split(',')[1] || fileData;

      // Return file information to be stored in the database
      return {
        file_data: base64Data,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
      };
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: `Failed to process file: ${error.message || error}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddResource = async () => {
    if (!admin) {
      toast({
        title: "Error",
        description: "Admin user not found",
        variant: "destructive",
      });
      return;
    }

    if (!newResource.title) {
      toast({
        title: "Error",
        description: "Please enter a title for the resource",
        variant: "destructive",
      });
      return;
    }

    if (!newResource.url && !selectedFile) {
      toast({
        title: "Error",
        description: "Please either upload a file or enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare resource data
      const resourceData: any = {
        title: newResource.title,
        description: newResource.description || "",
        type: newResource.type,
        created_by: admin.id,
      };

      // Handle file upload if a file is selected
      if (selectedFile) {
        const fileData = await handleFileUpload();
        if (!fileData) {
          // File upload failed, stop the process
          console.log("File upload failed, stopping resource creation");
          return;
        }
        
        // Store file data in the resource object
        resourceData.file_data = fileData.file_data;
        resourceData.file_name = fileData.file_name;
        resourceData.file_size = fileData.file_size;
        resourceData.file_type = fileData.file_type;
        resourceData.url = null; // No URL for file resources
      } else {
        // Store URL for link resources
        resourceData.url = newResource.url;
        resourceData.file_data = null;
        resourceData.file_name = null;
        resourceData.file_size = null;
        resourceData.file_type = null;
      }

      console.log("Inserting resource into database:", resourceData);

      const { data, error } = await supabase.from("learning_resources").insert(resourceData);

      if (error) {
        console.error("Database insert error:", error);
        throw error;
      }

      console.log("Resource inserted successfully:", data);

      toast({
        title: "Success",
        description: "Resource added successfully",
      });

      setNewResource({
        title: "",
        description: "",
        url: "",
        type: "link",
      });
      setSelectedFile(null);
      setShowAddResource(false);
      fetchResources();
    } catch (error) {
      console.error("Failed to add resource:", error);
      toast({
        title: "Error",
        description: `Failed to add resource: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;

    try {
      const { error } = await supabase
        .from("learning_resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });

      fetchResources();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  if (loading && quizScores.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16 overflow-hidden relative">
      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={300} top="5%" left="10%" delay={0.5} />
      <FloatingShape color="pink" size={150} top="20%" left="50%" delay={1} />
      <FloatingShape color="pink" size={200} top="70%" left="70%" delay={0} />
      <FloatingShape color="purple" size={250} top="8%" left="85%" delay={0} />
      <FloatingShape
        color="pink"
        size={180}
        top="75%"
        left="10%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={130}
        top="45%"
        left="80%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={150}
        top="80%"
        left="20%"
        delay={1.5}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Button
            onClick={() => navigate("/admin/dashboard")}
            variant="outline"
            className="border-primary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            Learning Management
          </h1>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-primary/50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Total Quiz Scores
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalQuizScores}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Total Resources
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalResources}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border-primary/30 p-6">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-primary mr-4" />
              <div>
                <p className="text-sm font-medium text-foreground/80">
                  Average Score
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {averageScore.toFixed(1)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quiz Scores Section */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-primary" />
                Recent Quiz Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {quizScores.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No quiz scores yet
                  </p>
                ) : (
                  quizScores.map((score) => (
                    <div
                      key={score.id}
                      className="p-4 bg-background/50 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-foreground">
                            {score.players?.full_name || "Unknown Player"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {score.players?.email || "No email"}
                          </p>
                          {score.players?.group_name && (
                            <Badge variant="secondary" className="mt-1">
                              {score.players.group_name}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">
                            {score.score}/{score.total_questions}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(score.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {score.quiz_title}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resources Section */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-primary" />
                  Learning Resources
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddResource(!showAddResource)}
                    size="sm"
                    className="bg-gradient-primary"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Resource
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showAddResource && (
                <div className="mb-6 p-4 bg-background/50 rounded-lg border border-primary/20">
                  <h3 className="font-semibold mb-4">Add New Resource</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Title *</Label>
                      <Input
                        value={newResource.title}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            title: e.target.value,
                          })
                        }
                        placeholder="Resource title"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={newResource.description}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            description: e.target.value,
                          })
                        }
                        placeholder="Brief description"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={newResource.type}
                        onValueChange={(
                          value: "link" | "pdf" | "doc" | "video"
                        ) => setNewResource({ ...newResource, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">Link</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="doc">Document</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Upload File or Enter URL</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            console.log("File selected:", file);
                            if (file) {
                              console.log("File details:", {
                                name: file.name,
                                size: file.size,
                                type: file.type,
                              });
                            }
                            setSelectedFile(file);
                          }}
                          className="flex-1"
                        />
                        <span className="text-muted-foreground self-center">
                          OR
                        </span>
                        <Input
                          value={newResource.url}
                          onChange={(e) =>
                            setNewResource({
                              ...newResource,
                              url: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="flex-1"
                          disabled={!!selectedFile}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddResource}
                        disabled={loading || uploadingFile}
                        className="flex-1"
                      >
                        {uploadingFile ? "Uploading..." : "Add Resource"}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddResource(false);
                          setNewResource({
                            title: "",
                            description: "",
                            url: "",
                            type: "link",
                          });
                          setSelectedFile(null);
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {resources.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No resources yet
                  </p>
                ) : (
                  resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-4 bg-background/50 rounded-lg border border-primary/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <p className="font-semibold text-foreground">
                              {resource.title}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resource.description}
                          </p>
                          <Badge variant="secondary" className="mt-2">
                            {resource.type.toUpperCase()}
                          </Badge>
                          {resource.file_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File: {resource.file_name} ({Math.round((resource.file_size || 0) / 1024)} KB)
                            </p>
                          )}
                          {resource.created_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Added: {new Date(resource.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              // If it's a file resource, create a download link
                              if (resource.file_data) {
                                try {
                                  // Fetch the full resource data from the database to get the raw byte data
                                  const { data, error } = await supabase
                                    .from("learning_resources")
                                    .select("file_data, file_name, file_type")
                                    .eq("id", resource.id)
                                    .single();
                                    
                                  if (error) throw error;
                                  
                                  if (data && data.file_data) {
                                    try {
                                      // Convert base64 to binary data
                                      const byteCharacters = atob(data.file_data);
                                      const byteNumbers = new Array(byteCharacters.length);
                                      for (let i = 0; i < byteCharacters.length; i++) {
                                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                                      }
                                      const byteArray = new Uint8Array(byteNumbers);
                                      const blob = new Blob([byteArray], { 
                                        type: data.file_type || 'application/octet-stream' 
                                      });
                                      
                                      // Create download link
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = data.file_name || 'download';
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    } catch (processingError) {
                                      console.error("Error processing file data:", processingError);
                                      // Fallback: try to create a blob directly from the data
                                      try {
                                        const blob = new Blob([data.file_data], { 
                                          type: data.file_type || 'application/octet-stream' 
                                        });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = data.file_name || 'download';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      } catch (fallbackError) {
                                        console.error("Fallback error:", fallbackError);
                                        toast({
                                          title: "Error",
                                          description: "Failed to process file data. The file may be corrupted.",
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  }
                                } catch (error) {
                                  console.error("Error downloading file:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to download file. There was a database error.",
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                // For URL resources, open in new tab
                                window.open(resource.url, "_blank");
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteResource(resource.id)}
                            className="border-red-500/50 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLearningManagement;
