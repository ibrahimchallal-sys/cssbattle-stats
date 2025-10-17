import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileText,
  BookOpen,
  Trophy,
  Lightbulb,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Maximize,
  Minimize,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LearningResource {
  id: number;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "doc" | "link" | "video";
}

const LearningCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Resource state
  const [resources, setResources] = useState<LearningResource[]>([
    {
      id: 1,
      title: "CSS Battle Guide",
      description: "Complete guide to mastering CSS Battle techniques",
      url: "#",
      type: "pdf",
    },
    {
      id: 2,
      title: "Official Documentation",
      description: "Official CSS Battle platform documentation",
      url: "https://cssbattle.dev/docs",
      type: "link",
    },
  ]);

  // New resource form
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    url: "",
    type: "pdf" as "pdf" | "doc" | "link" | "video",
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Sample quiz questions
  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "What is the main purpose of CSS Battle?",
      options: [
        "To compete in JavaScript coding challenges",
        "To improve CSS skills through visual challenges",
        "To learn HTML structure",
        "To practice database queries",
      ],
      correctAnswer: 1,
      explanation:
        "CSS Battle is a platform designed to help developers improve their CSS skills through fun, visual challenges.",
    },
    {
      id: 2,
      question: "How are scores calculated in CSS Battle?",
      options: [
        "Based on lines of code written",
        "Based on accuracy and code efficiency",
        "Based on time spent",
        "Based on number of attempts",
      ],
      correctAnswer: 1,
      explanation:
        "Scores are calculated based on how closely your CSS matches the target image, with efficiency measured by code length.",
    },
    {
      id: 3,
      question: "Which CSS property is most important in CSS Battle?",
      options: [
        "background-color",
        "position",
        "clip-path",
        "All of the above",
      ],
      correctAnswer: 3,
      explanation:
        "CSS Battle challenges often require a combination of properties, including positioning, background colors, and clip-path for complex shapes.",
    },
  ];

  // Prevent screenshots, copy/paste, and drag/drop
  useEffect(() => {
    const preventActions = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // Only apply restrictions for non-admin users
    if (!isAdmin) {
      document.addEventListener("keydown", (e) => {
        // Prevent Print Screen
        if (e.key === "PrintScreen") {
          navigator.clipboard.writeText("");
          toast({
            title: "Action Restricted",
            description: "Screenshots are not allowed during learning.",
            variant: "destructive",
          });
        }

        // Prevent Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        if (
          e.ctrlKey &&
          (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")
        ) {
          e.preventDefault();
          toast({
            title: "Action Restricted",
            description: "Copy/paste actions are not allowed during learning.",
            variant: "destructive",
          });
          return false;
        }

        // Prevent F12 (developer tools)
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }
      });

      // Prevent right-click
      document.addEventListener("contextmenu", preventActions);

      // Prevent drag and drop
      document.addEventListener("dragstart", preventActions);
      document.addEventListener("drop", preventActions);
    }

    return () => {
      document.removeEventListener("keydown", () => {});
      document.removeEventListener("contextmenu", preventActions);
      document.removeEventListener("dragstart", preventActions);
      document.removeEventListener("drop", preventActions);
    };
  }, [isAdmin, toast]);

  // Store the maximum time the player has reached
  const [maxTime, setMaxTime] = useState(0);

  const handleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setVideoCompleted(true);
    toast({
      title: "Video Completed!",
      description: "You've finished watching the tutorial. Now try the quiz!",
      duration: 3000,
    });
  };

  const handleVideoReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setVideoCompleted(false);
      setQuizCompleted(false); // Reset quiz when video is reset
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuizScore(0);
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement
        ?.requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(() => {
          toast({
            title: "Fullscreen Error",
            description: "Could not enter fullscreen mode.",
            variant: "destructive",
          });
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch(() => {
          toast({
            title: "Fullscreen Error",
            description: "Could not exit fullscreen mode.",
            variant: "destructive",
          });
        });
    }
  };

  // Prevent skipping forward
  const handleVideoSeek = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>
  ) => {
    if (!isAdmin && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      // If trying to skip forward beyond what they've watched
      if (currentTime > maxTime + 1) {
        // Allow 1 second buffer
        videoRef.current.currentTime = maxTime;
        toast({
          title: "Navigation Restricted",
          description:
            "You can only navigate to parts of the video you've already watched.",
          variant: "destructive",
        });
      } else if (currentTime > maxTime) {
        // Update max time if they've gone forward legitimately
        setMaxTime(currentTime);
      }
    }
  };

  // Update max time as video plays
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !isAdmin) {
      const currentTime = videoRef.current.currentTime;
      if (currentTime > maxTime) {
        setMaxTime(currentTime);
      }
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Please select an answer",
        description: "You need to choose an option before submitting.",
        variant: "destructive",
      });
      return;
    }

    const isCorrect =
      selectedAnswer === quizQuestions[currentQuestion].correctAnswer;
    setShowResult(true);

    if (isCorrect) {
      setQuizScore(quizScore + 1);
    }

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setQuizCompleted(true);
        toast({
          title: "Quiz Completed!",
          description: `You scored ${quizScore + (isCorrect ? 1 : 0)}/${
            quizQuestions.length
          }`,
          duration: 5000,
        });
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setQuizCompleted(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleResourceUpload = () => {
    // Only admins can upload resources
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can upload resources.",
        variant: "destructive",
      });
      return;
    }

    if (!newResource.title || !newResource.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for the resource.",
        variant: "destructive",
      });
      return;
    }

    // If a file is selected, use it; otherwise use the URL
    let resourceUrl = newResource.url;
    if (selectedFile) {
      // In a real implementation, this would upload the file to a server
      resourceUrl = URL.createObjectURL(selectedFile);
    } else if (!newResource.url) {
      toast({
        title: "Missing File or URL",
        description: "Please either select a file or provide a URL.",
        variant: "destructive",
      });
      return;
    }

    const newResourceItem: LearningResource = {
      id: resources.length + 1,
      ...newResource,
      url: resourceUrl,
    };

    setResources([...resources, newResourceItem]);

    // Reset form
    setNewResource({
      title: "",
      description: "",
      url: "",
      type: "pdf",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      title: "Resource Added!",
      description: "Your learning resource has been added successfully.",
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "doc":
        return <FileText className="w-5 h-5 text-blue-500" />;
      case "video":
        return <Play className="w-5 h-5 text-purple-500" />;
      case "link":
        return <ExternalLink className="w-5 h-5 text-green-500" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              Learning Center
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Master CSS Battle with our tutorials, quizzes, and learning
              resources
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Tutorial Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2 text-battle-purple" />
                  Video Tutorial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      onEnded={handleVideoEnd}
                      onSeeking={handleVideoSeek}
                      onTimeUpdate={handleVideoTimeUpdate}
                      controls={false}
                    >
                      <source src="/tutorial-video.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Video Overlay Controls */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {!videoCompleted ? (
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleVideoPlay}
                            size="lg"
                            className="bg-primary/80 hover:bg-primary text-white rounded-full w-16 h-16"
                          >
                            {isPlaying ? (
                              <Pause className="w-8 h-8" />
                            ) : (
                              <Play className="w-8 h-8 ml-1" />
                            )}
                          </Button>
                          <Button
                            onClick={toggleFullscreen}
                            size="lg"
                            variant="outline"
                            className="bg-black/50 hover:bg-black/70 text-white border-white/30 rounded-full w-12 h-12"
                          >
                            {isFullscreen ? (
                              <Minimize className="w-6 h-6" />
                            ) : (
                              <Maximize className="w-6 h-6" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center bg-black/70 p-4 rounded-lg">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="text-white font-medium">
                            Video Completed!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {videoCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {videoCompleted ? "Completed" : "Not completed"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleVideoReset}
                        variant="outline"
                        size="sm"
                        className="border-battle-purple/50 hover:bg-battle-purple/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-battle-purple" />
                  Knowledge Check
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!videoCompleted ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Video Required</h3>
                    <p className="text-muted-foreground mb-6">
                      Please complete the video tutorial first to unlock the
                      quiz.
                    </p>
                    <Button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.scrollIntoView({
                            behavior: "smooth",
                          });
                        }
                      }}
                      className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      Watch Video
                    </Button>
                  </div>
                ) : quizCompleted ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
                    <p className="text-muted-foreground mb-6">
                      You scored {quizScore}/{quizQuestions.length}
                    </p>
                    <Button
                      onClick={resetQuiz}
                      className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      Retake Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Question {currentQuestion + 1} of {quizQuestions.length}
                      </span>
                      <span className="text-sm font-medium">
                        Score: {quizScore}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">
                        {quizQuestions[currentQuestion].question}
                      </h3>

                      <div className="space-y-3">
                        {quizQuestions[currentQuestion].options.map(
                          (option, index) => (
                            <div
                              key={index}
                              onClick={() =>
                                !showResult && handleAnswerSelect(index)
                              }
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                selectedAnswer === index
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              } ${
                                showResult
                                  ? index ===
                                    quizQuestions[currentQuestion].correctAnswer
                                    ? "border-green-500 bg-green-500/10"
                                    : selectedAnswer === index
                                    ? "border-red-500 bg-red-500/10"
                                    : ""
                                  : ""
                              }`}
                            >
                              <div className="flex items-center">
                                <div
                                  className={`w-6 h-6 rounded-full border mr-3 flex items-center justify-center ${
                                    selectedAnswer === index
                                      ? "border-primary bg-primary"
                                      : "border-border"
                                  } ${
                                    showResult
                                      ? index ===
                                        quizQuestions[currentQuestion]
                                          .correctAnswer
                                        ? "border-green-500 bg-green-500"
                                        : selectedAnswer === index
                                        ? "border-red-500 bg-red-500"
                                        : ""
                                      : ""
                                  }`}
                                >
                                  {showResult &&
                                    (index ===
                                    quizQuestions[currentQuestion]
                                      .correctAnswer ? (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    ) : selectedAnswer === index ? (
                                      <XCircle className="w-4 h-4 text-white" />
                                    ) : null)}
                                  {!showResult && selectedAnswer === index && (
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <span>{option}</span>
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {showResult && (
                        <div
                          className={`mt-4 p-4 rounded-lg ${
                            selectedAnswer ===
                            quizQuestions[currentQuestion].correctAnswer
                              ? "bg-green-500/10 border border-green-500/30"
                              : "bg-red-500/10 border border-red-500/30"
                          }`}
                        >
                          <div className="flex items-start">
                            {selectedAnswer ===
                            quizQuestions[currentQuestion].correctAnswer ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                            )}
                            <div>
                              <p
                                className={`font-medium ${
                                  selectedAnswer ===
                                  quizQuestions[currentQuestion].correctAnswer
                                    ? "text-green-500"
                                    : "text-red-500"
                                }`}
                              >
                                {selectedAnswer ===
                                quizQuestions[currentQuestion].correctAnswer
                                  ? "Correct!"
                                  : "Incorrect"}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {quizQuestions[currentQuestion].explanation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswer === null && !showResult}
                      className="w-full bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {showResult ? "Next Question" : "Submit Answer"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Learning Resources Section */}
          <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-battle-purple" />
                  Learning Resources
                </div>
                {isAdmin && (
                  <Button
                    onClick={() =>
                      document
                        .getElementById("resource-form")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow text-xs h-8"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Add Resource
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-card/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{resource.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {resource.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-battle-purple/50 hover:bg-battle-purple/10"
                            onClick={() => {
                              if (resource.type === "link") {
                                window.open(resource.url, "_blank");
                              } else {
                                // In a real implementation, this would download the file
                                toast({
                                  title: "Resource Access",
                                  description:
                                    "In a real implementation, this would download or open the resource.",
                                });
                              }
                            }}
                          >
                            {resource.type === "link" ? (
                              <>
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Open
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Resource Form - Only visible to admins */}
              {isAdmin && (
                <div id="resource-form" className="border-t border-border pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-battle-purple" />
                    Add New Resource
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
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

                    <div className="space-y-2">
                      <Label htmlFor="type">Resource Type</Label>
                      <select
                        id="type"
                        value={newResource.type}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            type: e.target.value as
                              | "pdf"
                              | "doc"
                              | "link"
                              | "video",
                          })
                        }
                        className="w-full p-2 border rounded-md bg-background border-border"
                        aria-label="Resource type"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="doc">Document</option>
                        <option value="video">Video</option>
                        <option value="link">External Link</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={newResource.description}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            description: e.target.value,
                          })
                        }
                        placeholder="Brief description of the resource"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="file">Upload File (Optional)</Label>
                      <Input
                        ref={fileInputRef}
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.txt,.mp4,.mov"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="url">
                        URL (Required if no file uploaded)
                      </Label>
                      <Input
                        id="url"
                        value={newResource.url}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            url: e.target.value,
                          })
                        }
                        placeholder="https://example.com/resource or file path"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Button
                        onClick={handleResourceUpload}
                        className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isAdmin && (
                <div className="text-center py-6 text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Only administrators can add new learning resources.</p>
                  <p className="text-sm mt-1">
                    Players can only view and download existing resources.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LearningCenter;
