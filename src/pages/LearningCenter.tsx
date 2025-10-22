import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FloatingShape from "@/components/FloatingShape";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  FileText,
  BookOpen,
  Trophy,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertCircle,
  Maximize,
  Minimize,
  Lock,
  Search,
  Filter,
  Calendar,
  File,
  Video,
  Link,
  ChevronDown,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import usePreventRightClick from "@/hooks/usePreventRightClick";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LearningResource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "pdf" | "doc" | "link" | "video";
  file_data?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  created_at?: string;
}

const LearningCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Prevent right-click for players and non-authenticated users
  usePreventRightClick();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoCompletionChecked, setVideoCompletionChecked] = useState(false);

  // Store the maximum time the player has reached
  const [maxTime, setMaxTime] = useState(0);

  // Quiz state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [quizCompletionChecked, setQuizCompletionChecked] = useState(false);

  // Resource state
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<
    LearningResource[]
  >([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [visibleResources, setVisibleResources] = useState(3);
  const [selectedResource, setSelectedResource] =
    useState<LearningResource | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title">("date");
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

  // Check if user has already completed the quiz
  useEffect(() => {
    // Reset the check flag when user changes
    setQuizCompletionChecked(false);

    const checkQuizCompletion = async () => {
      if (!user) return;

      // Small delay to ensure user object is fully loaded
      setTimeout(async () => {
        try {
          // First check localStorage for immediate UI update
          const completionKey = `quiz_completed_${user.id}`;
          const localStorageCompleted =
            localStorage.getItem(completionKey) === "true";

          if (localStorageCompleted) {
            setQuizCompleted(true);
            // Also restore the quiz score if available
            const scoreKey = `quiz_score_${user.id}`;
            const savedScore = localStorage.getItem(scoreKey);
            console.log("Restoring quiz score from localStorage:", savedScore);
            if (savedScore) {
              setQuizScore(parseInt(savedScore, 10));
            }
            setQuizCompletionChecked(true);
            return;
          }

          // If not in localStorage, check database
          console.log(
            "Checking quiz completion in database for user:",
            user.id
          );
          const { data, error } = await supabase
            .from("quiz_scores")
            .select("score")
            .eq("player_id", user.id)
            .limit(1);

          if (error) {
            console.error("Error checking quiz completion in database:", error);
            setQuizCompletionChecked(true);
            return;
          }

          if (data && data.length > 0) {
            console.log("Quiz completion found in database:", data[0]);
            setQuizCompleted(true);
            setQuizScore(data[0].score);
            // We only set scoreSaved to true when actually saving a new score

            // Also save to localStorage for faster loading next time
            localStorage.setItem(completionKey, "true");
            const scoreKey = `quiz_score_${user.id}`;
            localStorage.setItem(scoreKey, data[0].score.toString());
          }
        } catch (error) {
          console.error("Failed to check quiz completion:", error);
        } finally {
          setQuizCompletionChecked(true);
        }
      }, 100);
    };

    checkQuizCompletion();
  }, [user, language]); // Add language as dependency

  // Save quiz score when completed
  useEffect(() => {
    const saveScore = async (finalScore: number) => {
      if (!user) return;

      try {
        // First, check if a score already exists for this user
        console.log("Checking if quiz score already exists for user:", user.id);
        const { data: existingData, error: checkError } = await supabase
          .from("quiz_scores")
          .select("id")
          .eq("player_id", user.id)
          .limit(1);

        if (checkError) {
          console.error("Error checking existing quiz score:", checkError);
          toast({
            title: "Error",
            description: "Failed to check quiz status. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // If score already exists, don't insert again
        if (existingData && existingData.length > 0) {
          console.log(
            "Quiz score already exists for user, not inserting again"
          );
          setScoreSaved(true); // Set scoreSaved to true to prevent future attempts
          return;
        }

        // If no existing score, insert the new one
        console.log(
          "Saving quiz score to database for user:",
          user.id,
          "score:",
          finalScore
        );
        const { data, error } = await supabase.from("quiz_scores").insert({
          player_id: user.id,
          score: finalScore,
          total_questions: quizQuestions.length,
          quiz_title: "Learning Center Quiz",
          completed_at: new Date().toISOString(),
        });

        if (error) {
          console.error("Error saving quiz score to database:", error);
          toast({
            title: "Error",
            description: "Failed to save quiz score. Please try again.",
            variant: "destructive",
          });
          return;
        }

        console.log("Quiz score saved to database successfully:", data);
        setScoreSaved(true); // Only set this to true when we actually save

        // Also save completion status in localStorage
        const completionKey = `quiz_completed_${user.id}`;
        localStorage.setItem(completionKey, "true");
        const scoreKey = `quiz_score_${user.id}`;
        localStorage.setItem(scoreKey, finalScore.toString());
        console.log("Quiz completion status saved to localStorage");

        // Show success message to user
        toast({
          title: "Success",
          description:
            "Quiz completed successfully! Your score has been saved and the quiz is now permanently completed.",
        });
      } catch (e) {
        console.error("Failed to save quiz score", e);
        toast({
          title: "Error",
          description: "Failed to save quiz score. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (quizCompleted && !scoreSaved) {
      console.log("Quiz completed, saving score...");
      saveScore(quizScore);
    }
  }, [quizCompleted, scoreSaved, user]);

  // Fetch resources from database
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from("learning_resources")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        const resourcesData = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description || "",
          url: r.url,
          type: r.type as "pdf" | "doc" | "link" | "video",
          file_data: r.file_data,
          file_name: r.file_name,
          file_size: r.file_size,
          file_type: r.file_type,
          created_at: r.created_at,
        }));
        setResources(resourcesData);
        setFilteredResources(resourcesData);
      } catch (error) {
        console.error("Failed to fetch resources:", error);
      } finally {
        setLoadingResources(false);
      }
    };

    fetchResources();
  }, []);

  // Sample quiz questions - 5 basic questions + 1 advanced question
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
    {
      id: 4,
      question:
        language === "en" ? "What does CSS stand for?" : "Que signifie CSS ?",
      options:
        language === "en"
          ? [
              "Computer Style Sheets",
              "Creative Style System",
              "Cascading Style Sheets",
              "Colorful Style Sheets",
            ]
          : [
              "Computer Style Sheets",
              "Creative Style System",
              "Cascading Style Sheets",
              "Colorful Style Sheets",
            ],
      correctAnswer: 2,
      explanation:
        language === "en"
          ? "CSS stands for Cascading Style Sheets, which is used to style and layout web pages."
          : "CSS signifie Cascading Style Sheets, utilisé pour styliser et mettre en page les pages web.",
    },
    {
      id: 5,
      question:
        language === "en"
          ? "Which CSS property is used to change the text color?"
          : "Quelle propriété CSS est utilisée pour changer la couleur du texte ?",
      options:
        language === "en"
          ? ["font-color", "text-color", "color", "text-style"]
          : ["font-color", "text-color", "color", "text-style"],
      correctAnswer: 2,
      explanation:
        language === "en"
          ? "The 'color' property is used to set the color of text in CSS."
          : "La propriété 'color' est utilisée pour définir la couleur du texte en CSS.",
    },
    {
      id: 6,
      question:
        language === "en"
          ? "What is the CSS Grid 'fr' unit used for?"
          : "À quoi sert l'unité CSS Grid 'fr' ?",
      options:
        language === "en"
          ? [
              "To set font size",
              "To represent a fraction of available space",
              "To create flexible borders",
              "To define frame rates",
            ]
          : [
              "Pour définir la taille de la police",
              "Pour représenter une fraction de l'espace disponible",
              "Pour créer des bordures flexibles",
              "Pour définir les fréquences d'images",
            ],
      correctAnswer: 1,
      explanation:
        language === "en"
          ? "The 'fr' unit in CSS Grid represents a fraction of the available space in the grid container."
          : "L'unité 'fr' dans CSS Grid représente une fraction de l'espace disponible dans le conteneur de la grille.",
    },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exit fullscreen with Escape key
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }

      // Prevent screenshots, copy/paste, and drag/drop
      if (!isAdmin) {
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
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen, isAdmin, toast, t]);

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

  const handleVideoEnd = async () => {
    setIsPlaying(false);
    setVideoCompleted(true);
    await saveVideoCompletion(); // Save completion status
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
      // Note: We don't reset the quiz when video is reset since quiz completion is now permanent
      // The quiz section will remain hidden if it was already completed
      setIsPlaying(false);
      setMaxTime(0); // Reset max time tracking

      // Reset the video completion status in the database
      if (user) {
        supabase
          .from("players")
          .update({
            video_completed: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id)
          .then(({ error }) => {
            if (error) {
              console.error(
                "Failed to reset video completion in database:",
                error
              );
            } else {
              console.log(
                "Video completion status reset in database for user",
                user.id
              );
            }
          });
      }
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
    // Prevent answer selection if quiz is already completed
    if (quizCompleted) {
      toast({
        title: "Quiz Already Completed",
        description:
          "You have already completed this quiz. Each player can only take the quiz once.",
        variant: "destructive",
      });
      return;
    }
    setSelectedAnswer(answerIndex);
  };

  const handleQuizSubmit = () => {
    // Additional check to ensure quiz cannot be submitted if already completed
    if (quizCompleted) {
      toast({
        title: "Quiz Already Completed",
        description:
          "You have already completed this quiz. Each player can only take the quiz once.",
        variant: "destructive",
      });
      return;
    }

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

    // Calculate the new score
    const newScore = isCorrect ? quizScore + 1 : quizScore;

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        // Update the score only after moving to the next question
        setQuizScore(newScore);
      } else {
        // For the last question, update the score immediately and mark quiz as completed
        setQuizScore(newScore);
        setQuizCompleted(true);
        toast({
          title: t("common.success"),
          description: t("learning.quiz.score")
            .replace("{score}", newScore.toString())
            .replace("{total}", quizQuestions.length.toString()),
          duration: 5000,
        });

        // Show a message that the score will be visible to admins
        toast({
          title: "Score Submitted",
          description:
            "Your quiz score has been submitted and will be visible to all administrators.",
          duration: 3000,
        });
      }
    }, 2000);
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

  // Check if user has already completed the video
  useEffect(() => {
    // Reset the check flag when user changes
    setVideoCompletionChecked(false);

    const checkVideoCompletion = async () => {
      if (!user) {
        console.log("No user object available for video completion check");
        return;
      }

      console.log("Checking video completion for user ID:", user.id);

      // Small delay to ensure user object is fully loaded
      setTimeout(async () => {
        try {
          // Check database for video completion status
          console.log(
            "Checking video completion in database for user:",
            user.id
          );
          const { data, error } = await supabase
            .from("players")
            .select("video_completed")
            .eq("id", user.id)
            .limit(1);

          if (error) {
            console.error(
              "Error checking video completion in database:",
              error
            );
            setVideoCompletionChecked(true);
            return;
          }

          if (data && data.length > 0 && data[0].video_completed) {
            setVideoCompleted(true);
            console.log("Video completion found in database for user", user.id);
          } else {
            console.log(
              "No video completion found in database for user",
              user.id
            );
          }
        } catch (error) {
          console.error("Failed to check video completion:", error);
        } finally {
          setVideoCompletionChecked(true);
        }
      }, 100);
    };

    checkVideoCompletion();
  }, [user, language]); // Add language as dependency

  // Save video completion status
  const saveVideoCompletion = async () => {
    if (!user) {
      console.log("No user available to save video completion");
      return;
    }

    try {
      // Save to database for persistence
      const { error } = await supabase
        .from("players")
        .update({
          video_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Failed to save video completion to database:", error);
      } else {
        console.log(
          "Video completion status saved to database for user",
          user.id
        );
      }
    } catch (error) {
      console.error("Failed to save video completion:", error);
    }
  };

  // Filter resources based on search term and type filter
  useEffect(() => {
    let result = [...resources];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (resource) =>
          resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          resource.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (resourceTypeFilter !== "all") {
      result = result.filter(
        (resource) => resource.type === resourceTypeFilter
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === "date") {
        return (
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
        );
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    setFilteredResources(result);
    setVisibleResources(3); // Reset to show only 3 resources when filters change
  }, [resources, searchTerm, resourceTypeFilter, sortBy]);

  // Load more resources
  const loadMoreResources = () => {
    setVisibleResources((prev) => Math.min(prev + 3, filteredResources.length));
  };

  // Load less resources
  const loadLessResources = () => {
    setVisibleResources((prev) => Math.max(3, prev - 3));
  };

  // Open resource detail modal
  const openResourceModal = (resource: LearningResource) => {
    setSelectedResource(resource);
    setIsResourceModalOpen(true);
  };

  // Close resource detail modal
  const closeResourceModal = () => {
    setIsResourceModalOpen(false);
    setSelectedResource(null);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      <Navbar />

      {/* Animated Background Shapes */}
      <FloatingShape color="purple" size={200} top="10%" left="5%" delay={0} />
      <FloatingShape
        color="pink"
        size={150}
        top="70%"
        left="85%"
        delay={1}
        rotation
      />
      <FloatingShape
        color="yellow"
        size={100}
        top="40%"
        left="80%"
        delay={0.5}
      />
      <FloatingShape
        color="purple"
        size={120}
        top="85%"
        left="15%"
        delay={1.5}
      />

      <main className="relative z-10 container mx-auto px-4 py-8 mt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
              {t("learning.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("learning.subtitle")}
            </p>
          </div>

          {/* Library-style layout with tabs for different sections */}
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
            {/* Video Tutorial Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 lg:col-span-2">
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
                      onError={(e) => {
                        console.error("Video error:", e);
                        toast({
                          title: "Video Error",
                          description:
                            "Failed to load video. Please try again later.",
                          variant: "destructive",
                        });
                      }}
                      onLoadedData={() =>
                        console.log("Video loaded successfully")
                      }
                      controls={false}
                    >
                      <source src="/Video-Project.mp4" type="video/mp4" />
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
                    {/* Exit fullscreen button - only visible in fullscreen mode */}
                    {isFullscreen && (
                      <Button
                        onClick={toggleFullscreen}
                        size="sm"
                        variant="ghost"
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 transition-all duration-200"
                      >
                        <Minimize className="w-5 h-5" />
                      </Button>
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
                                ? "Exit fullscreen (Esc)"
                                : "Quitter le plein écran (Échap)"
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
                        width:
                          videoRef.current && videoRef.current.duration
                            ? `${
                                (videoRef.current.currentTime /
                                  videoRef.current.duration) *
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

            {/* Quiz Section - Only show if quiz is not completed */}
            {!quizCompleted && (
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
                  ) : (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {t("learning.quiz.question")
                            .replace(
                              "{current}",
                              (currentQuestion + 1).toString()
                            )
                            .replace(
                              "{total}",
                              quizQuestions.length.toString()
                            )}
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
                                      quizQuestions[currentQuestion]
                                        .correctAnswer
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
                                    {!showResult &&
                                      selectedAnswer === index && (
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
                        onClick={() => handleQuizSubmit()}
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
            )}

            {/* Show quiz results when completed */}
            {quizCompleted && (
              <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30">
                <div className="text-center py-4">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">
                    {t("learning.quiz.completed")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {t("learning.quiz.score")
                      .replace("{score}", quizScore.toString())
                      .replace("{total}", quizQuestions.length.toString())}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("learning.quiz.completedMessage")}
                  </p>
                </div>
              </Card>
            )}

            {/* Learning Resources Section */}
            <Card className="bg-card/50 backdrop-blur-sm border-battle-purple/30 lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-battle-purple" />
                  {t("learning.resources.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Bar */}
                <div className="mb-6 p-4 bg-background/50 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Type Filter */}
                    <div>
                      <select
                        value={resourceTypeFilter}
                        onChange={(e) => setResourceTypeFilter(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Filter resources by type"
                      >
                        <option value="all">All Types</option>
                        <option value="pdf">PDF</option>
                        <option value="doc">Document</option>
                        <option value="video">Video</option>
                        <option value="link">Link</option>
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as "date" | "title")
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Sort resources by"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="title">Sort by Title</option>
                      </select>
                    </div>
                  </div>
                </div>

                {loadingResources ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-battle-purple"></div>
                  </div>
                ) : filteredResources.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {t("learning.resources.none")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("learning.resources.noneDesc")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Resource Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredResources
                        .slice(0, visibleResources)
                        .map((resource) => (
                          <Card
                            key={resource.id}
                            className="bg-background/50 rounded-lg border border-border hover:border-battle-purple/50 transition-colors cursor-pointer h-48 flex flex-col"
                            onClick={() => openResourceModal(resource)}
                          >
                            <CardContent className="p-4 flex flex-col h-full">
                              <div className="flex items-start mb-2">
                                <div className="mr-3 mt-1">
                                  {getResourceIcon(resource.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">
                                    {resource.title}
                                  </h3>
                                </div>
                              </div>
                              <div className="mt-2 flex-grow">
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                  {resource.description}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <Badge variant="secondary" className="text-xs">
                                  {resource.type.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-foreground/50">
                                  {resource.created_at
                                    ? new Date(
                                        resource.created_at
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                              <Button
                                variant="link"
                                size="sm"
                                className="mt-3 p-0 h-auto text-battle-purple hover:text-battle-pink w-full justify-start"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResourceModal(resource);
                                }}
                              >
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                    </div>

                    {/* Load More/Less Buttons */}
                    <div className="flex justify-center gap-4 mt-6">
                      {visibleResources < filteredResources.length && (
                        <Button
                          onClick={loadMoreResources}
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10"
                        >
                          <ChevronRight className="w-4 h-4 mr-2" />
                          View 3 More
                        </Button>
                      )}

                      {visibleResources > 3 && (
                        <Button
                          onClick={loadLessResources}
                          variant="outline"
                          className="border-battle-purple/50 hover:bg-battle-purple/10"
                        >
                          <ChevronLeft className="w-4 h-4 mr-2" />
                          View Less
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resource Detail Modal */}
        <Dialog
          open={isResourceModalOpen}
          onOpenChange={setIsResourceModalOpen}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedResource && getResourceIcon(selectedResource.type)}
                {selectedResource?.title}
              </DialogTitle>
            </DialogHeader>

            {selectedResource && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedResource.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">
                    Added:{" "}
                    {selectedResource.created_at
                      ? new Date(
                          selectedResource.created_at
                        ).toLocaleDateString()
                      : "N/A"}
                  </Badge>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {selectedResource.description}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={async () => {
                      // If it's a file stored in the database, create a download link
                      if (selectedResource.file_data) {
                        try {
                          // Fetch the full resource data from the database to get the raw byte data
                          const { data, error } = await supabase
                            .from("learning_resources")
                            .select("file_data, file_name, file_type")
                            .eq("id", selectedResource.id)
                            .single();

                          if (error) throw error;

                          if (data && data.file_data) {
                            try {
                              // First, try to determine if the data is base64 encoded or raw binary
                              let blob;

                              // Check if it's a valid base64 string
                              const isBase64 =
                                /^[A-Za-z0-9+/]*={0,2}$/.test(data.file_data) &&
                                data.file_data.length % 4 === 0;

                              if (isBase64) {
                                // Convert base64 to binary data
                                const byteCharacters = atob(data.file_data);
                                const byteNumbers = new Array(
                                  byteCharacters.length
                                );
                                for (
                                  let i = 0;
                                  i < byteCharacters.length;
                                  i++
                                ) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                blob = new Blob([byteArray], {
                                  type:
                                    data.file_type ||
                                    "application/octet-stream",
                                });
                              } else {
                                // Treat as raw string data
                                blob = new Blob([data.file_data], {
                                  type:
                                    data.file_type ||
                                    "application/octet-stream",
                                });
                              }

                              // Create download link
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = data.file_name || "download";
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch (processingError) {
                              console.error(
                                "Error processing file data:",
                                processingError
                              );
                              // Fallback: try to create a blob directly from the data
                              try {
                                const blob = new Blob([data.file_data], {
                                  type:
                                    data.file_type ||
                                    "application/octet-stream",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = data.file_name || "download";
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              } catch (fallbackError) {
                                console.error("Fallback error:", fallbackError);
                                toast({
                                  title: "Error",
                                  description:
                                    "Failed to process file data. The file may be corrupted.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }
                        } catch (error) {
                          console.error("Error downloading file:", error);
                          toast({
                            title: "Error",
                            description:
                              "Failed to download file. There was a database error.",
                            variant: "destructive",
                          });
                        }
                      } else {
                        // For URL resources, open in new tab
                        window.open(selectedResource.url, "_blank");
                      }
                    }}
                    className="bg-gradient-primary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {selectedResource.file_data
                      ? "Download File"
                      : "Visit Link"}
                  </Button>

                  <Button variant="outline" onClick={closeResourceModal}>
                    {t("common.close")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default LearningCenter;
