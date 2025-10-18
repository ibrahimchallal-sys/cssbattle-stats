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
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Store the maximum time the player has reached
  const [maxTime, setMaxTime] = useState(0);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
const [quizCompleted, setQuizCompleted] = useState(false);
const [scoreSaved, setScoreSaved] = useState(false);

// Save quiz score when completed
useEffect(() => {
  const saveScore = async () => {
    if (!user) return;
    try {
      await supabase.from("quiz_scores").insert({
        player_id: user.id,
        score: quizScore,
        total_questions: quizQuestions.length,
        quiz_title: "Learning Center Quiz",
      });
      setScoreSaved(true);
    } catch (e) {
      console.error("Failed to save quiz score", e);
    }
  };

  if (quizCompleted && !scoreSaved) {
    saveScore();
  }
}, [quizCompleted, scoreSaved, user, quizScore]);

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
      question:
        language === "en"
          ? "What is the main purpose of CSS Battle?"
          : "Quel est le but principal de CSS Battle ?",
      options:
        language === "en"
          ? [
              "To compete in JavaScript coding challenges",
              "To improve CSS skills through visual challenges",
              "To learn HTML structure",
              "To practice database queries",
            ]
          : [
              "Participer à des défis de codage JavaScript",
              "Améliorer les compétences CSS grâce à des défis visuels",
              "Apprendre la structure HTML",
              "Pratiquer les requêtes de base de données",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "CSS Battle is a platform designed to help developers improve their CSS skills through fun, visual challenges."
          : "CSS Battle est une plateforme conçue pour aider les développeurs à améliorer leurs compétences CSS grâce à des défis visuels amusants.",
    },
    {
      id: 2,
      question:
        language === "en"
          ? "How are scores calculated in CSS Battle?"
          : "Comment les scores sont-ils calculés dans CSS Battle ?",
      options:
        language === "en"
          ? [
              "Based on lines of code written",
              "Based on accuracy and code efficiency",
              "Based on time spent",
              "Based on number of attempts",
            ]
          : [
              "Basé sur le nombre de lignes de code écrites",
              "Basé sur la précision et l'efficacité du code",
              "Basé sur le temps passé",
              "Basé sur le nombre de tentatives",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "Scores are calculated based on how closely your CSS matches the target image, with efficiency measured by code length."
          : "Les scores sont calculés en fonction de la ressemblance entre votre CSS et l'image cible, avec une efficacité mesurée par la longueur du code.",
    },
    {
      id: 3,
      question:
        language === "en"
          ? "Which CSS property is most important in CSS Battle?"
          : "Quelle propriété CSS est la plus importante dans CSS Battle ?",
      options:
        language === "en"
          ? ["background-color", "position", "clip-path", "All of the above"]
          : [
              "background-color",
              "position",
              "clip-path",
              "Toutes les réponses ci-dessus",
            ],
      correctAnswer: 3,
      explanation:
        language === "en"
          ? "CSS Battle challenges often require a combination of properties, including positioning, background colors, and clip-path for complex shapes."
          : "Les défis CSS Battle nécessitent souvent une combinaison de propriétés, notamment le positionnement, les couleurs d'arrière-plan et clip-path pour les formes complexes.",
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
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent Print Screen
        if (e.key === "PrintScreen") {
          navigator.clipboard.writeText("");
          toast({
            title: t("learning.video.screenshotRestricted"),
            description: t("learning.video.screenshotRestrictedDesc"),
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
            title: t("learning.video.screenshotRestricted"),
            description: t("learning.video.copyRestrictedDesc"),
            variant: "destructive",
          });
          return false;
        }

        // Prevent F12 (developer tools)
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }

        // Prevent Ctrl+Shift+I (developer tools)
        if (e.ctrlKey && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }

        // Prevent Ctrl+U (view source)
        if (e.ctrlKey && e.key === "u") {
          e.preventDefault();
          return false;
        }
      };

      // Prevent right-click
      const handleContextMenu = (e: Event) => {
        e.preventDefault();
        toast({
          title: t("learning.video.screenshotRestricted"),
          description: t("learning.video.screenshotRestrictedDesc"),
          variant: "destructive",
        });
        return false;
      };

      // Prevent drag and drop
      const handleDragStart = (e: Event) => {
        e.preventDefault();
        toast({
          title: t("learning.video.screenshotRestricted"),
          description: t("learning.video.copyRestrictedDesc"),
          variant: "destructive",
        });
        return false;
      };

      // Prevent drop
      const handleDrop = (e: Event) => {
        e.preventDefault();
        toast({
          title: t("learning.video.screenshotRestricted"),
          description: t("learning.video.copyRestrictedDesc"),
          variant: "destructive",
        });
        return false;
      };

      // Prevent selection
      const handleSelectStart = (e: Event) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("dragstart", handleDragStart);
      document.addEventListener("drop", handleDrop);
      document.addEventListener("selectstart", handleSelectStart);

      // Prevent video download
      const preventVideoDownload = () => {
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          video.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            toast({
              title: t("learning.video.screenshotRestricted"),
              description: t("learning.video.screenshotRestrictedDesc"),
              variant: "destructive",
            });
          });

          // Remove download attribute if present
          video.removeAttribute("controlsList");
          video.setAttribute("controlsList", "nodownload");
        });
      };

      // Run immediately and after a short delay to catch dynamically loaded videos
      preventVideoDownload();
      setTimeout(preventVideoDownload, 1000);
    }

    return () => {
      document.removeEventListener("keydown", () => {});
      document.removeEventListener("contextmenu", () => {});
      document.removeEventListener("dragstart", () => {});
      document.removeEventListener("drop", () => {});
      document.removeEventListener("selectstart", () => {});
    };
  }, [isAdmin, toast, t]);

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
      title: t("learning.video.completed"),
      description: t("learning.video.completedDesc"),
      duration: 3000,
    });
  };

  const handleVideoReset = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setVideoCompleted(false);
      setQuizCompleted(false); // Reset quiz when video is reset
      setScoreSaved(false);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuizScore(0);
      setIsPlaying(false);
      setMaxTime(0); // Reset max time tracking
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
            title: t("learning.video.fullscreenError"),
            description: t("learning.video.fullscreenErrorDesc"),
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
            title: t("learning.video.fullscreenError"),
            description: t("learning.video.fullscreenExitErrorDesc"),
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
          title: t("learning.video.restricted"),
          description: t("learning.video.restrictedDesc"),
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
        title: t("learning.quiz.select"),
        description: t("learning.quiz.selectDesc"),
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
          title: t("common.success"),
          description: t("learning.quiz.score")
            .replace("{score}", (quizScore + (isCorrect ? 1 : 0)).toString())
            .replace("{total}", quizQuestions.length.toString()),
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
    setScoreSaved(false);
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
        title: t("learning.resources.accessDenied"),
        description: t("learning.resources.accessDeniedDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!newResource.title || !newResource.description) {
      toast({
        title: t("learning.resources.missingInfo"),
        description: t("learning.resources.missingInfoDesc"),
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
        title: t("learning.resources.missingFile"),
        description: t("learning.resources.missingFileDesc"),
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
      title: t("learning.resources.added"),
      description: t("learning.resources.addedDesc"),
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
              {t("learning.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("learning.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Tutorial Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="w-5 h-5 mr-2 text-battle-purple" />
                  {t("learning.video.title")}
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
                      {language === "en"
                        ? "Your browser does not support the video tag."
                        : "Votre navigateur ne prend pas en charge la balise vidéo."}
                    </video>

                    {videoCompleted && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-black/70 p-4 rounded-lg">
                          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                          <p className="text-white font-medium">
                            {t("learning.video.completed")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Controls - Above timeline with status label */}
                  {!videoCompleted && (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10 mb-3">
                        <div className="relative group">
                          <Button
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = Math.max(
                                  0,
                                  videoRef.current.currentTime - 5
                                );
                              }
                            }}
                            size="sm"
                            variant="ghost"
                            className="bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full w-9 h-9 transition-all duration-200 hover:scale-105"
                          >
                            <span className="text-xs font-bold">-5s</span>
                          </Button>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {language === "en"
                              ? "Back 5 seconds"
                              : "Reculer 5 secondes"}
                          </span>
                        </div>

                        <div className="relative group">
                          <Button
                            onClick={handleVideoPlay}
                            size="sm"
                            variant="ghost"
                            className="bg-primary/80 hover:bg-primary text-white rounded-full w-9 h-9 transition-all duration-200 hover:scale-105"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </Button>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {isPlaying
                              ? language === "en"
                                ? "Pause"
                                : "Pause"
                              : language === "en"
                              ? "Play"
                              : "Lecture"}
                          </span>
                        </div>

                        <div className="relative group">
                          <Button
                            onClick={toggleFullscreen}
                            size="sm"
                            variant="ghost"
                            className="bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full w-9 h-9 transition-all duration-200 hover:scale-105"
                          >
                            {isFullscreen ? (
                              <Minimize className="w-4 h-4" />
                            ) : (
                              <Maximize className="w-4 h-4" />
                            )}
                          </Button>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {isFullscreen
                              ? language === "en"
                                ? "Exit fullscreen"
                                : "Quitter le plein écran"
                              : language === "en"
                              ? "Enter fullscreen"
                              : "Plein écran"}
                          </span>
                        </div>

                        <div className="relative group">
                          <Button
                            onClick={handleVideoReset}
                            variant="ghost"
                            size="sm"
                            className="bg-black/30 hover:bg-black/50 text-white border border-white/20 rounded-full w-9 h-9 transition-all duration-200 hover:scale-105"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-black/80 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {language === "en"
                              ? "Reset video"
                              : "Réinitialiser la vidéo"}
                          </span>
                        </div>

                        {/* Status label beside buttons */}
                        <div className="flex items-center ml-2 pl-2 border-l border-white/20">
                          <div className="inline-flex items-center bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            <span className="text-xs font-medium">
                              {t("learning.video.notCompleted")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video Timeline - Below controls */}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {videoRef.current
                        ? `${Math.floor(
                            videoRef.current.currentTime / 60
                          )}:${Math.floor(videoRef.current.currentTime % 60)
                            .toString()
                            .padStart(2, "0")}`
                        : "0:00"}
                    </span>
                    <span>
                      {videoRef.current
                        ? `${Math.floor(
                            videoRef.current.duration / 60
                          )}:${Math.floor(videoRef.current.duration % 60)
                            .toString()
                            .padStart(2, "0")}`
                        : "0:00"}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-battle-purple h-1.5 rounded-full"
                      style={{
                        width: videoRef.current
                          ? `${
                              (videoRef.current.currentTime /
                                (videoRef.current.duration || 1)) *
                              100
                            }%`
                          : "0%",
                      }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground text-right">
                    {language === "en"
                      ? `Watched: ${Math.floor(maxTime / 60)}:${Math.floor(
                          maxTime % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : `Regardé: ${Math.floor(maxTime / 60)}:${Math.floor(
                          maxTime % 60
                        )
                          .toString()
                          .padStart(2, "0")}`}
                  </div>

                  {/* Status section for completed video */}
                  {videoCompleted && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center">
                        <div className="inline-flex items-center bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            {t("learning.video.completed")}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleVideoReset}
                          variant="outline"
                          size="sm"
                          className="border-battle-purple/50 hover:bg-battle-purple/10"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {t("learning.video.reset")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quiz Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-battle-purple" />
                  {t("learning.quiz.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!videoCompleted ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">
                      {t("learning.quiz.videoRequired")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("learning.quiz.videoRequiredDesc")}
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
                      {t("learning.quiz.watchVideo")}
                    </Button>
                  </div>
                ) : quizCompleted ? (
                  <div className="text-center py-8">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">
                      {t("learning.quiz.completed")}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t("learning.quiz.score")
                        .replace("{score}", quizScore.toString())
                        .replace("{total}", quizQuestions.length.toString())}
                    </p>
                    <Button
                      onClick={resetQuiz}
                      className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                    >
                      {t("learning.quiz.retake")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {t("learning.quiz.question")
                          .replace(
                            "{current}",
                            (currentQuestion + 1).toString()
                          )
                          .replace("{total}", quizQuestions.length.toString())}
                      </span>
                      <span className="text-sm font-medium">
                        {t("common.continue")}: {quizScore}
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
                                  ? t("learning.quiz.correct")
                                  : t("learning.quiz.incorrect")}
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
                      {showResult
                        ? t("learning.quiz.next")
                        : t("learning.quiz.submit")}
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
                  {t("learning.resources.title")}
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
                    {t("learning.resources.add")}
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
                                  title:
                                    t("common.continue") +
                                    " " +
                                    t("learning.resources.title"),
                                  description:
                                    language === "en"
                                      ? "In a real implementation, this would download or open the resource."
                                      : "Dans une implémentation réelle, cela téléchargerait ou ouvrirait la ressource.",
                                });
                              }
                            }}
                          >
                            {resource.type === "link" ? (
                              <>
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {t("common.view")}
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1" />
                                {t("common.download")}
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
                    {t("learning.resources.form.title")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">
                        {t("learning.resources.form.titleLabel")}
                      </Label>
                      <Input
                        id="title"
                        value={newResource.title}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            title: e.target.value,
                          })
                        }
                        placeholder={
                          language === "en"
                            ? "Resource title"
                            : "Titre de la ressource"
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">
                        {t("learning.resources.form.typeLabel")}
                      </Label>
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
                        aria-label={
                          language === "en"
                            ? "Resource type"
                            : "Type de ressource"
                        }
                        title={
                          language === "en"
                            ? "Resource type"
                            : "Type de ressource"
                        }
                      >
                        <option value="pdf">
                          {language === "en" ? "PDF Document" : "Document PDF"}
                        </option>
                        <option value="doc">
                          {language === "en" ? "Document" : "Document"}
                        </option>
                        <option value="video">
                          {language === "en" ? "Video" : "Vidéo"}
                        </option>
                        <option value="link">
                          {language === "en" ? "External Link" : "Lien Externe"}
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">
                        {t("learning.resources.form.descLabel")}
                      </Label>
                      <Textarea
                        id="description"
                        value={newResource.description}
                        onChange={(e) =>
                          setNewResource({
                            ...newResource,
                            description: e.target.value,
                          })
                        }
                        placeholder={
                          language === "en"
                            ? "Brief description of the resource"
                            : "Brève description de la ressource"
                        }
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="file">
                        {t("learning.resources.form.fileLabel")}
                      </Label>
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
                        {t("learning.resources.form.urlLabel")}
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
                        placeholder={
                          language === "en"
                            ? "https://example.com/resource or file path"
                            : "https://exemple.com/ressource ou chemin du fichier"
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Button
                        onClick={handleResourceUpload}
                        className="bg-gradient-primary hover:scale-105 transition-transform shadow-glow"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t("common.upload")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!isAdmin && (
                <div className="text-center py-6 text-muted-foreground">
                  <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t("learning.resources.adminOnly")}</p>
                  <p className="text-sm mt-1">
                    {t("learning.resources.playerInfo")}
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
