import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createLearningBucket } from "@/lib/storageUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [creatingBucket, setCreatingBucket] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    type: "link" as "pdf" | "doc" | "link" | "video",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchQuizScores(), fetchResources()]);
    setLoading(false);
  };

  // Check if the learning bucket exists when the component mounts
  const checkBucket = async () => {
    try {
      const { data, error } = await supabase.storage.getBucket("learning");

      if (error && error.message.includes("not found")) {
        toast({
          title: "Storage Bucket Missing",
          description:
            "The 'learning' storage bucket doesn't exist. Please click 'Create Bucket' above to create it.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error checking bucket:", error);
    }
  };

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate("/admin");
      return;
    }
    fetchData();
    checkBucket();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQuizScores();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAdmin, adminLoading, navigate]);

  const handleCreateBucket = async () => {
    if (!admin) {
      toast({
        title: "Error",
        description: "Admin privileges required to create storage bucket",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingBucket(true);
      const { success, message } = await createLearningBucket();

      if (success) {
        toast({
          title: "Success",
          description: message,
        });
      } else {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating bucket:", error);
      toast({
        title: "Error",
        description: `Failed to create bucket: ${error.message || error}`,
        variant: "destructive",
      });
    } finally {
      setCreatingBucket(false);
    }
  };

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
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `resources/${fileName}`;

      console.log("Attempting to upload file:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        filePath: filePath,
      });

      // First, let's check if we can access the storage bucket
      const { data: bucketData, error: bucketError } =
        await supabase.storage.getBucket("learning");

      if (bucketError) {
        console.error("Bucket access error:", bucketError);

        // If bucket doesn't exist, provide helpful instructions
        if (bucketError.message && bucketError.message.includes("not found")) {
          toast({
            title: "Storage Bucket Missing",
            description:
              "The 'learning' storage bucket doesn't exist. Please click 'Create Bucket' button above to create it, or contact your system administrator.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Cannot access storage bucket: ${bucketError.message}`,
            variant: "destructive",
          });
        }
        return null;
      }

      console.log("Bucket access successful:", bucketData);

      const { data, error: uploadError } = await supabase.storage
        .from("learning")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Detailed upload error:", uploadError.message);
        console.error(
          "Full error details:",
          JSON.stringify(uploadError, null, 2)
        );
        toast({
          title: "Error",
          description: `Failed to upload file: ${uploadError.message}`,
          variant: "destructive",
        });
        return null;
      }

      console.log("Upload successful:", data);

      const {
        data: { publicUrl },
      } = supabase.storage.from("learning").getPublicUrl(filePath);

      console.log("Public URL generated:", publicUrl);
      return publicUrl;
    } catch (error) {
      console.error("Unexpected error during file upload:", error);
      toast({
        title: "Error",
        description: `Unexpected error: ${error.message || error}`,
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

      let resourceUrl = newResource.url;
      if (selectedFile) {
        const uploadedUrl = await handleFileUpload();
        if (!uploadedUrl) {
          // File upload failed, stop the process
          console.log("File upload failed, stopping resource creation");
          return;
        }
        resourceUrl = uploadedUrl;
      }

      console.log("Inserting resource into database:", {
        title: newResource.title,
        description: newResource.description || "",
        url: resourceUrl,
        type: newResource.type,
        created_by: admin.id,
      });

      const { data, error } = await supabase.from("learning_resources").insert({
        title: newResource.title,
        description: newResource.description || "",
        url: resourceUrl,
        type: newResource.type,
        created_by: admin.id,
      });

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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 mt-16">
      <div className="max-w-7xl mx-auto">
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
                    onClick={handleCreateBucket}
                    disabled={creatingBucket}
                    variant="outline"
                    size="sm"
                    className="border-primary/50"
                  >
                    {creatingBucket ? "Creating..." : "Create Bucket"}
                  </Button>
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
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(resource.url, "_blank")}
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
